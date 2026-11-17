// Gold Membership (SOW ERP-05; api.md §3a; docs/04-modules/membership.md).
// Sales Executives register members in the field (with a payment screenshot from the gallery or the camera);
// Admins and Managers verify or reject in the queue. The backend checks every permission and rule; this screen
// only hides what the signed-in person can't use and explains the rules before the server has to.
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, type Me } from "./api";
import { config } from "./config";
import { Camera, ImageIcon, X, ZoomIn } from "lucide-react";
import {
  INDIAN_STATES, MIN_DOB, aadhaarProblem, calculateAge, cleanMobile, dobProblem, formatAadhaar, isValidMobile, isValidPincode, licenceProblem,
  localToday, lookupPincode, maskAadhaar, maskLicence, maxDobFor18, parseFeeChips, rupees, toTitleCase,
} from "./smartFields";

export interface Member {
  id: string; membershipId: string; firstName: string; lastName: string; dob: string; mobile: string; email: string;
  address: string; tier: string; status: string; enrolledBy: { employeeId: string; name: string; username: string };
  decidedBy: string | null; decidedAt: string | null; validFrom: string | null; validUntil: string | null;
  accountStatus: string; createdAt: string;
  /** ID proof and structured address (D-131, D-133); null for members registered before them. */
  idType?: string | null; idNumberMasked?: string | null;
  pincode?: string | null; city?: string | null; state?: string | null; country?: string | null;
  payment: {
    type: string; amount: string; currency: string; transactionId: string | null; status: string;
    rejectionReason: string | null; verifiedBy: string | null; decidedAt: string | null;
    proof: { fileName: string; contentType: string; sizeBytes: number; sha256: string } | null;
  };
}
interface Page { items: Member[]; page: number; size: number; total: number; pendingCount: number | null }
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export const MEMBER_STATUS: Record<string, string> = {
  PENDING_VERIFICATION: "Awaiting verification",
  ACTIVE: "Active",
  REJECTED: "Rejected",
};
const PAYMENT_TYPES = [
  { value: "CASH", label: "Cash", hint: "Amount received in hand" },
  { value: "CARD", label: "Card", hint: "Swipe / tap at the terminal" },
  { value: "SCAN_QR", label: "Scan QR", hint: "Customer pays the resort UPI QR" },
];
/** The customer's website account (Keycloak gh-guests) after verification (D-120…D-122). */
export const ACCOUNT_STATUS: Record<string, string> = {
  NOT_PROVISIONED: "Not created yet",
  INVITE_SENT: "Welcome email sent — waiting for the customer to set a password",
  INVITE_FAILED: "Welcome email failed — resend it",
  ACTIVE: "Customer has signed in",
};
const PAYMENT_LABEL: Record<string, string> = { CASH: "Cash", CARD: "Card", SCAN_QR: "Scan QR (UPI)" };
const EMPTY = {
  firstName: "", lastName: "", dob: "", mobile: "", email: "", address: "", paymentType: "CASH", amount: "", transactionId: "",
  idType: "AADHAAR", idNumber: "", pincode: "", city: "", state: "Karnataka", country: "India",
};
const ID_LABEL: Record<string, string> = { AADHAAR: "Aadhaar", DRIVING_LICENCE: "Driving licence" };
const FEE_CHIPS = parseFeeChips(config.goldFeeChips);

/** "12 MG Road, Belagavi, Karnataka – 590006, India"; older members only have the one address line. */
export const fullAddress = (m: Member) =>
  m.city ? `${m.address}, ${m.city}, ${m.state} – ${m.pincode}, ${m.country}` : m.address;
type Field = keyof typeof EMPTY | "proof";

const inr = (amount: string) =>
  "₹" + Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const today = () => localToday();
const objectUrl = (b: Blob) => (typeof URL.createObjectURL === "function" ? URL.createObjectURL(b) : "blob:preview");
const freeUrl = (u: string | null) => { if (u && u.startsWith("blob:") && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(u); };

/**
 * Phone photos are often 5–12 MP and several MB. Shrink to at most 2000 px on the long side (still enough to read a
 * UTR) so the upload stays under the 5 MB limit on mobile data. Falls back to the original file if the browser can't.
 */
async function shrink(file: File): Promise<File> {
  if (file.size <= 1_500_000 || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function Memberships({ me, request }: { me: Me; request: Request }) {
  const canRegister = me.permissions.includes("memberships.register");
  const canReadOwn = me.permissions.includes("memberships.read_own");
  const canVerify = me.permissions.includes("memberships.read_all");
  const tabs = [
    ...(canRegister ? [{ id: "register", label: "Register member" }] : []),
    ...(canReadOwn ? [{ id: "mine", label: "My members" }] : []),
    ...(canVerify ? [{ id: "queue", label: "Verification queue" }] : []),
  ];
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const refreshCount = useCallback(() => {
    if (!canVerify) return;
    request<Page>("/api/v1/admin/memberships?status=PENDING_VERIFICATION&size=1")
      .then((p) => setPendingCount(p.pendingCount ?? p.total), () => setPendingCount(null));
  }, [canVerify, request]);
  useEffect(refreshCount, [refreshCount]);

  return (
    <section>
      <header className="page-head">
        <p className="page-kicker">Privilege Club</p>
        <h1>Gold Membership</h1>
        <p>Register members in the field, follow your registrations and verify payments.</p>
      </header>

      <div className="mem-tabs" role="tablist" aria-label="Memberships">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""}
                  onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "queue" && pendingCount != null && pendingCount > 0 && <span className="mem-badge">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {tab === "register" && <RegisterMember me={me} request={request} onRegistered={refreshCount} />}
      {tab === "mine" && <MyMembers request={request} />}
      {tab === "queue" && <VerificationQueue me={me} request={request} onDecided={refreshCount} />}
    </section>
  );
}

// --- Register ---------------------------------------------------------------------------------------------------------

function RegisterMember({ me, request, onRegistered }: { me: Me; request: Request; onRegistered: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [fields, setFields] = useState<Partial<Record<Field, string>>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  const loadNext = useCallback(() => {
    request<{ membershipId: string }>("/api/v1/sales/memberships/next-number").then((n) => setNextId(n.membershipId), () => setNextId(null));
  }, [request]);
  useEffect(loadNext, [loadNext]);
  useEffect(() => () => freeUrl(preview), [preview]);

  const set = (k: keyof typeof EMPTY) => (v: string) => { setForm((f) => ({ ...f, [k]: v })); setKey(crypto.randomUUID()); };

  // Smart fields (D-131…D-134): checked as the executive types; the server checks everything again.
  const age = calculateAge(form.dob);
  const dobErr = dobProblem(form.dob);
  const mobileOk = isValidMobile(form.mobile);
  const idProblem = form.idType === "AADHAAR" ? aadhaarProblem(form.idNumber) : licenceProblem(form.idNumber);
  const idComplete = form.idType === "AADHAAR" ? form.idNumber.replace(/\D/g, "").length === 12 : form.idNumber.trim().length >= 13;
  const pincodeOk = isValidPincode(form.pincode);
  const [pinNote, setPinNote] = useState<string | null>(null);
  const blocked = !form.dob || dobErr !== null || !mobileOk || idProblem !== null || !pincodeOk;

  async function pincodeTyped(raw: string) {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    set("pincode")(pin);
    setPinNote(null);
    if (pin.length !== 6) return;
    const hit = await lookupPincode(pin);
    if (hit) {
      setForm((f) => ({ ...f, city: hit.city, state: hit.state, country: "India" }));
      setPinNote("City and state filled from India Post data. Change them if needed.");
    }
  }

  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const small = await shrink(f);
    freeUrl(preview);
    setProof(small);
    setPreview(objectUrl(small));
    setFields((x) => ({ ...x, proof: undefined }));
    setKey(crypto.randomUUID());
  }
  function removeProof() {
    freeUrl(preview);
    setProof(null); setPreview(null);
    if (gallery.current) gallery.current.value = "";
    if (camera.current) camera.current.value = "";
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setMessage(null);
    if (form.paymentType === "SCAN_QR" && !proof) {
      setFields({ proof: "Add the payment screenshot (gallery or camera)." });
      return;
    }
    setBusy(true); setFields({});
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "transactionId" && form.paymentType === "CASH") return;
      body.append(k, k === "mobile" ? "+91" + v : v);
    });
    if (proof && form.paymentType === "SCAN_QR") body.append("proof", proof, proof.name);
    try {
      const m = await request<Member>("/api/v1/sales/memberships", { method: "POST", headers: { "Idempotency-Key": key }, body });
      setMessage({ ok: true, text: `${m.membershipId} is registered for ${m.firstName} ${m.lastName}. It now waits for a manager to verify the payment.` });
      setForm(EMPTY); removeProof(); setKey(crypto.randomUUID()); setPinNote(null);
      loadNext(); onRegistered();
    } catch (err) {
      if (err instanceof ApiError) setFields((err.body as { fields?: Record<string, string> } | null)?.fields ?? {});
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const input = (k: keyof typeof EMPTY, label: string, type = "text", extra: Record<string, string> = {}) => (
    <label>{label}
      <input type={type} required value={form[k]} onChange={(e) => set(k)(e.target.value)} aria-invalid={!!fields[k]} {...extra} />
      {fields[k] && <small role="alert">{fields[k]}</small>}
    </label>
  );
  const emp = me.employee;

  return (
    <div className="form-card">
      <form onSubmit={(e) => void submit(e)} aria-label="Register Gold member" noValidate>
        <div className="mem-head">
          <div>
            <h2>New Gold Member</h2>
            <p>Fill in the customer's details, take the payment, and submit for verification.</p>
          </div>
          <div className="mem-tag" aria-live="polite">
            <span className="mem-tag-label">Membership ID</span>
            <strong>{nextId ?? "GRH-LM-····"}</strong>
            <small>Provisional — confirmed when you submit</small>
          </div>
        </div>

        <fieldset className="mem-section">
          <legend>1 · Customer</legend>
          <div className="form-row two-col">
            <label>First name
              <input type="text" required autoComplete="off" value={form.firstName} aria-invalid={!!fields.firstName}
                     onChange={(e) => set("firstName")(e.target.value)} onBlur={(e) => set("firstName")(toTitleCase(e.target.value))} />
              {fields.firstName && <small role="alert">{fields.firstName}</small>}
            </label>
            <label>Last name
              <input type="text" required autoComplete="off" value={form.lastName} aria-invalid={!!fields.lastName}
                     onChange={(e) => set("lastName")(e.target.value)} onBlur={(e) => set("lastName")(toTitleCase(e.target.value))} />
              {fields.lastName && <small role="alert">{fields.lastName}</small>}
            </label>
          </div>
          <div className="form-row three-col">
            <label>Date of birth
              <input type="date" aria-label="Date of birth" required min={MIN_DOB} max={maxDobFor18()} value={form.dob} aria-invalid={!!fields.dob || dobErr !== null}
                     onChange={(e) => set("dob")(e.target.value)} />
              {age && form.dob >= MIN_DOB && (
                <span className={`smart-pill ${age.isEligible ? "ok" : "bad"}`} role="status">
                  {age.isEligible ? `Age: ${age.age} years · Eligible ✓` : `Age: ${age.age} years · Must be 18+ ✗`}
                </span>
              )}
              {dobErr && !(age && form.dob >= MIN_DOB) && <small role="alert">{dobErr}</small>}
              {fields.dob && <small role="alert">{fields.dob}</small>}
            </label>
            <label>Mobile
              <span className="prefixed">
                <span className="prefix" aria-hidden="true">+91</span>
                <input type="tel" aria-label="Mobile (+91)" required inputMode="numeric" autoComplete="off" placeholder="98765 43210" value={form.mobile}
                       aria-invalid={!!fields.mobile} onChange={(e) => set("mobile")(cleanMobile(e.target.value))} />
                {mobileOk && <span className="smart-tick" aria-label="Valid mobile number">✓</span>}
              </span>
              {!mobileOk && form.mobile.length >= 10 && <small role="alert">10 digits, starting with 6, 7, 8 or 9.</small>}
              {fields.mobile && <small role="alert">{fields.mobile}</small>}
            </label>
            <label>Email
              <input type="email" required inputMode="email" placeholder="name@example.com" value={form.email} aria-invalid={!!fields.email}
                     onChange={(e) => set("email")(e.target.value.trim().toLowerCase())} />
              {fields.email && <small role="alert">{fields.email}</small>}
            </label>
          </div>

          <div className="mem-subhead">ID proof</div>
          <div className="mem-pills compact" role="radiogroup" aria-label="ID proof type">
            {Object.entries(ID_LABEL).map(([value, label]) => (
              <label key={value} className={`mem-pill${form.idType === value ? " selected" : ""}`}>
                <input type="radio" name="idType" value={value} checked={form.idType === value}
                       onChange={() => { set("idType")(value); set("idNumber")(""); }} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {form.idType === "AADHAAR" ? (
            <label>Aadhaar number
              <input type="text" aria-label="Aadhaar number" required inputMode="numeric" autoComplete="off" placeholder="XXXX XXXX XXXX" value={form.idNumber}
                     aria-invalid={!!fields.idNumber || (idComplete && idProblem !== null)} maxLength={14}
                     onChange={(e) => set("idNumber")(formatAadhaar(e.target.value))} />
              {idComplete && idProblem && <small role="alert">{idProblem}</small>}
              {!idProblem && <span className="smart-note">Stored only as {maskAadhaar(form.idNumber)}</span>}
              {fields.idNumber && <small role="alert">{fields.idNumber}</small>}
            </label>
          ) : (
            <label>Driving licence number
              <input type="text" aria-label="Driving licence number" required autoComplete="off" placeholder="KA01 20190001234" value={form.idNumber}
                     aria-invalid={!!fields.idNumber || (idComplete && idProblem !== null)} maxLength={24}
                     onChange={(e) => set("idNumber")(e.target.value.toUpperCase())} />
              {idComplete && idProblem && <small role="alert">{idProblem}</small>}
              {!idProblem && <span className="smart-note">Stored only as {maskLicence(form.idNumber)}</span>}
              {fields.idNumber && <small role="alert">{fields.idNumber}</small>}
            </label>
          )}
          {fields.idType && <small role="alert">{fields.idType}</small>}

          <div className="mem-subhead">Address</div>
          <label>Street address
            <textarea required rows={2} value={form.address} onChange={(e) => set("address")(e.target.value)} aria-invalid={!!fields.address}
                      maxLength={500} placeholder="House / flat, street, area" />
            {fields.address && <small role="alert">{fields.address}</small>}
          </label>
          <div className="form-row two-col">
            <label>Pincode
              <input type="text" aria-label="Pincode" required inputMode="numeric" autoComplete="off" placeholder="590001" value={form.pincode} maxLength={6}
                     aria-invalid={!!fields.pincode || (form.pincode.length === 6 && !pincodeOk)} onChange={(e) => void pincodeTyped(e.target.value)} />
              {pinNote && <span className="smart-note">{pinNote}</span>}
              {form.pincode.length === 6 && !pincodeOk && <small role="alert">A pincode can't start with 0.</small>}
              {fields.pincode && <small role="alert">{fields.pincode}</small>}
            </label>
            <label>City
              <input type="text" aria-label="City" required autoComplete="off" value={form.city} aria-invalid={!!fields.city} maxLength={100}
                     onChange={(e) => set("city")(e.target.value)} onBlur={(e) => set("city")(toTitleCase(e.target.value))} />
              {fields.city && <small role="alert">{fields.city}</small>}
            </label>
          </div>
          <div className="form-row two-col">
            <label>State
              <select required value={form.state} onChange={(e) => set("state")(e.target.value)} aria-invalid={!!fields.state}>
                {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              {fields.state && <small role="alert">{fields.state}</small>}
            </label>
            <label>Country
              {/* India only for now (D-133): the server rejects other countries. Add options here when that changes. */}
              <select required value={form.country} onChange={(e) => set("country")(e.target.value)} aria-invalid={!!fields.country}>
                <option value="India">India</option>
              </select>
              {fields.country && <small role="alert">{fields.country}</small>}
            </label>
          </div>
        </fieldset>

        <fieldset className="mem-section">
          <legend>2 · Membership</legend>
          <div className="mem-gold">
            <span className="mem-gold-chip">GOLD</span>
            <div>
              <strong>Gold Membership</strong>
              <small>Valid 12 months from verification · 180 resort privileges (55 vouchers + 125 coupons)</small>
            </div>
          </div>
        </fieldset>

        <fieldset className="mem-section">
          <legend>3 · Payment</legend>
          <div className="mem-pills" role="radiogroup" aria-label="Payment method">
            {PAYMENT_TYPES.map((p) => (
              <label key={p.value} className={`mem-pill${form.paymentType === p.value ? " selected" : ""}`}>
                <input type="radio" name="paymentType" value={p.value} checked={form.paymentType === p.value}
                       onChange={() => set("paymentType")(p.value)} />
                <span>{p.label}</span>
                <small>{p.hint}</small>
              </label>
            ))}
          </div>
          {fields.paymentType && <small role="alert">{fields.paymentType}</small>}

          {form.paymentType === "SCAN_QR" && (
            <div className="mem-qr">
              {config.upiQrUrl
                ? <figure><img src={config.upiQrUrl} alt="Golden Hills Resort UPI QR code" /><figcaption>Scan to pay Golden Hills Resort</figcaption></figure>
                : <div className="mem-qr-missing">UPI QR not configured yet. Show the resort's printed QR (Q-031).</div>}
            </div>
          )}

          {FEE_CHIPS.length > 0 && (
            <div className="fee-chips" role="group" aria-label="Quick amounts">
              {FEE_CHIPS.map((n) => (
                <button key={n} type="button" className={`fee-chip${form.amount === String(n) ? " selected" : ""}`}
                        onClick={() => set("amount")(String(n))}>{rupees(n)}</button>
              ))}
            </div>
          )}
          <div className={`form-row ${form.paymentType === "CASH" ? "" : "two-col"}`}>
            {input("amount", "Amount received (₹)", "text", { inputMode: "decimal", placeholder: "e.g. 25000" })}
            {form.paymentType === "CARD" && input("transactionId", "Transaction ID", "text", { autoComplete: "off" })}
            {form.paymentType === "SCAN_QR" && (
              <label>UPI reference (UTR), optional
                <input type="text" value={form.transactionId} onChange={(e) => set("transactionId")(e.target.value)} aria-invalid={!!fields.transactionId} />
                {fields.transactionId && <small role="alert">{fields.transactionId}</small>}
              </label>
            )}
          </div>

          {form.paymentType === "SCAN_QR" && (
            <div className="mem-proof">
              <span className="mem-proof-title">Payment screenshot (required)</span>
              {preview ? (
                <div className="mem-proof-preview">
                  <img src={preview} alt="Payment screenshot preview" />
                  <div className="mem-proof-actions">
                    <button type="button" className="btn-secondary" onClick={() => gallery.current?.click()}>Replace</button>
                    <button type="button" className="btn-secondary" onClick={() => camera.current?.click()}>Retake</button>
                    <button type="button" className="btn-outline" onClick={removeProof}>Remove</button>
                  </div>
                </div>
              ) : (
                <div className="mem-proof-pick">
                  <button type="button" className="btn-secondary" onClick={() => gallery.current?.click()}>
                    <ImageIcon size={15} aria-hidden="true" />
                    <span>Choose from gallery</span>
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => camera.current?.click()}>
                    <Camera size={15} aria-hidden="true" />
                    <span>Open camera</span>
                  </button>
                </div>
              )}
              {/* Two inputs: "capture" opens the rear camera directly on phones; the other opens the gallery/files. */}
              <input ref={gallery} type="file" accept="image/*" aria-label="Choose from gallery" className="visually-hidden"
                     onChange={(e) => void pick(e.target.files)} />
              <input ref={camera} type="file" accept="image/*" capture="environment" aria-label="Open camera" className="visually-hidden"
                     onChange={(e) => void pick(e.target.files)} />
              {fields.proof && <small role="alert">{fields.proof}</small>}
            </div>
          )}
        </fieldset>

        <fieldset className="mem-section" aria-label="Sales executive" role="group">
          <legend>4 · Sales executive</legend>
          <dl className="mem-exec">
            <div><dt>Name</dt><dd>{emp ? `${emp.firstName} ${emp.lastName}` : "—"}</dd></div>
            <div><dt>Employee</dt><dd>{emp?.username ?? "—"}</dd></div>
            <div><dt>Registration date</dt><dd>{today()}</dd></div>
          </dl>
        </fieldset>

        {message && <p className={message.ok ? "mem-ok" : "mem-error"} role={message.ok ? "status" : "alert"}>{message.text}</p>}
        <div className="form-footer">
          <span className="smart-note">{blocked ? "Complete the checks above (18+, mobile, ID proof, pincode) to register." : ""}</span>
          <button type="submit" disabled={busy || blocked}>{busy ? "Submitting…" : "Register member"}</button>
        </div>
      </form>
    </div>
  );
}

// --- Lists --------------------------------------------------------------------------------------------------------------

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`status-pill mem-status-${status.toLowerCase()}`}>
      <span className="status-dot"></span><span>{MEMBER_STATUS[status] ?? status}</span>
    </span>
  );
}

function MemberTable({ items, onReview, showExecutive }: { items: Member[]; onReview?: (m: Member) => void; showExecutive?: boolean }) {
  if (items.length === 0) return <p className="mem-empty">Nothing here yet.</p>;
  return (
    <div className="table-container">
      <table className="cards-on-phone">
        <thead>
          <tr>
            <th>Member</th><th>Membership ID</th><th>Payment</th>{showExecutive && <th>Enrolled by</th>}<th>Status</th>
            {onReview && <th style={{ textAlign: "right" }}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="row-user-info">
                  <span className="row-name">{m.firstName} {m.lastName}</span>
                  <span className="row-sub">{m.mobile} · {day(m.createdAt)}</span>
                </div>
              </td>
              <td data-label="Membership ID"><code>{m.membershipId}</code></td>
              <td data-label="Payment">{PAYMENT_LABEL[m.payment.type] ?? m.payment.type} · {inr(m.payment.amount)}</td>
              {showExecutive && <td data-label="Enrolled by">{m.enrolledBy.name}</td>}
              <td data-label="Status" title={m.payment.rejectionReason ?? ""}><StatusPill status={m.status} /></td>
              {onReview && (
                <td className="actions">
                  <button type="button" className="btn-secondary" aria-label={`Review ${m.membershipId}`} onClick={() => onReview(m)}>Review</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MyMembers({ request }: { request: Request }) {
  const [list, setList] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<Page>("/api/v1/sales/memberships?size=100").then((p) => setList(p.items), (e: Error) => setError(e.message));
  }, [request]);
  if (error) return <p role="alert">{error}</p>;
  if (!list) return <p>Loading…</p>;
  return (
    <div className="table-card">
      <div className="table-header-bar">
        <div className="table-title-group"><h2>My members</h2><span className="count-badge">{list.length}</span></div>
      </div>
      <MemberTable items={list} />
    </div>
  );
}

const QUEUE_FILTERS = [
  { value: "PENDING_VERIFICATION", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All" },
];

function VerificationQueue({ me, request, onDecided }: { me: Me; request: Request; onDecided: () => void }) {
  const [filter, setFilter] = useState("PENDING_VERIFICATION");
  const [list, setList] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Member | null>(null);

  const load = useCallback(() => {
    const q = filter ? `status=${filter}&` : "";
    request<Page>(`/api/v1/admin/memberships?${q}size=100`).then((p) => setList(p.items), (e: Error) => setError(e.message));
  }, [filter, request]);
  useEffect(load, [load]);

  return (
    <div className="table-card">
      <div className="table-header-bar">
        <div className="table-title-group"><h2>Verification queue</h2>{list && <span className="count-badge">{list.length}</span>}</div>
        <div className="mem-filters" role="group" aria-label="Filter by status">
          {QUEUE_FILTERS.map((f) => (
            <button key={f.label} type="button" className={filter === f.value ? "active" : ""} aria-pressed={filter === f.value}
                    onClick={() => setFilter(f.value)}>{f.label}</button>
          ))}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {!list ? <p>Loading…</p> : <MemberTable items={list} onReview={setOpen} showExecutive />}
      {open && (
        <ReviewDrawer member={open} me={me} request={request} onClose={() => setOpen(null)}
                      onDecided={() => { setOpen(null); load(); onDecided(); }} />
      )}
    </div>
  );
}

// --- Review -------------------------------------------------------------------------------------------------------------

function ReviewDrawer({ member: m, me, request, onClose, onDecided }:
                      { member: Member; me: Me; request: Request; onClose: () => void; onDecided: () => void }) {
  const [img, setImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mine = me.employee?.id === m.enrolledBy.employeeId;
  const [account, setAccount] = useState(m.accountStatus);
  const pending = m.status === "PENDING_VERIFICATION";
  const canDecide = me.permissions.includes("memberships.verify");

  useEffect(() => {
    if (!m.payment.proof) return;
    let url: string | null = null;
    request<Blob>(`/api/v1/admin/memberships/${m.id}/proof`)
      .then((b) => { url = objectUrl(b); setImg(url); }, () => setError("The payment screenshot could not be loaded."));
    return () => freeUrl(url);
  }, [m.id, m.payment.proof, request]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoom) setZoom(false);
      else onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [zoom, onClose]);

  async function resendWelcome() {
    setBusy(true); setError(null);
    try {
      const updated = await request<Member>(`/api/v1/admin/memberships/${m.id}/resend-welcome`, { method: "POST" });
      setAccount(updated.accountStatus);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(path: string, body?: object) {
    setBusy(true); setError(null);
    try {
      await request(`/api/v1/admin/memberships/${m.id}/${path}`, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) });
      onDecided();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mem-overlay" onClick={onClose}>
      <aside className="mem-drawer" role="dialog" aria-modal="true" aria-label={`Review ${m.membershipId}`} onClick={(e) => e.stopPropagation()}>
        <div className="mem-drawer-head">
          <div>
            <span className="mem-tag-label">Gold · {m.membershipId}</span>
            <h2>{m.firstName} {m.lastName}</h2>
            <StatusPill status={m.status} />
          </div>
          <button type="button" className="btn-outline" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <dl className="mem-details">
          <div><dt>Date of birth</dt><dd>{day(m.dob)}</dd></div>
          <div><dt>Mobile</dt><dd>{m.mobile}</dd></div>
          <div><dt>Email</dt><dd>{m.email}</dd></div>
          <div><dt>ID proof</dt><dd>{m.idType ? `${ID_LABEL[m.idType] ?? m.idType}: ${m.idNumberMasked}` : "Not recorded (registered before ID proof was required)"}</dd></div>
          <div className="wide"><dt>Address</dt><dd>{fullAddress(m)}</dd></div>
          <div><dt>Payment</dt><dd>{PAYMENT_LABEL[m.payment.type] ?? m.payment.type}</dd></div>
          <div><dt>Amount</dt><dd>{inr(m.payment.amount)}</dd></div>
          <div><dt>{m.payment.type === "CARD" ? "Transaction ID" : "UTR / reference"}</dt><dd>{m.payment.transactionId ?? "—"}</dd></div>
          <div><dt>Enrolled by</dt><dd>{m.enrolledBy.name} ({m.enrolledBy.username})</dd></div>
          <div><dt>Registered</dt><dd>{day(m.createdAt)}</dd></div>
          {m.validFrom && <div><dt>Valid</dt><dd>{day(m.validFrom)} – {day(m.validUntil)}</dd></div>}
          {m.decidedBy && <div><dt>Decided by</dt><dd>{m.decidedBy} · {day(m.decidedAt)}</dd></div>}
          {m.payment.rejectionReason && <div className="wide"><dt>Rejection reason</dt><dd>{m.payment.rejectionReason}</dd></div>}
        </dl>

        {m.payment.proof && (
          <div className="mem-shot">
            <span className="mem-proof-title">Payment screenshot · tap to zoom</span>
            {img
              ? <>
                  <img src={img} alt="Payment screenshot" className="mem-shot-img" onClick={() => setZoom(true)} />
                  <button type="button" className="btn-secondary" onClick={() => setZoom(true)}>
                    <ZoomIn size={14} aria-hidden="true" />
                    <span>Zoom to read the UTR</span>
                  </button>
                </>
              : <p>Loading screenshot…</p>}
            <small>SHA-256 {m.payment.proof.sha256.slice(0, 16)}… · {(m.payment.proof.sizeBytes / 1024).toFixed(0)} KB</small>
          </div>
        )}

        {error && <p className="mem-error" role="alert">{error}</p>}

        {m.status === "ACTIVE" && (
          <div className="mem-account">
            <span className="mem-proof-title">Customer website account</span>
            <p className={account === "INVITE_FAILED" ? "mem-error" : "mem-note"}>{ACCOUNT_STATUS[account] ?? account}</p>
            {canDecide && account !== "ACTIVE" && (
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => void resendWelcome()}>
                Resend welcome email
              </button>
            )}
          </div>
        )}

        {pending && canDecide && (
          mine ? (
            <p className="mem-note">You enrolled this member, so another Admin or Manager must verify the payment.</p>
          ) : rejecting ? (
            <div className="mem-reject">
              <label>Reason for rejecting
                <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
              </label>
              <div className="mem-drawer-actions">
                <button type="button" className="btn-outline" onClick={() => setRejecting(false)}>Back</button>
                <button type="button" className="btn-danger" disabled={busy || !reason.trim()}
                        onClick={() => void decide("reject", { reason: reason.trim() })}>Confirm rejection</button>
              </div>
            </div>
          ) : (
            <div className="mem-drawer-actions">
              <button type="button" className="btn-outline" onClick={() => setRejecting(true)}>Reject</button>
              <button type="button" disabled={busy} onClick={() => void decide("verify")}>Verify & activate</button>
            </div>
          )
        )}
      </aside>

      {zoom && img && (
        <div className="mem-lightbox" role="dialog" aria-label="Payment screenshot, zoomed" onClick={(e) => { e.stopPropagation(); setZoom(false); }}>
          <img src={img} alt="Payment screenshot, full size" />
        </div>
      )}
    </div>
  );
}
