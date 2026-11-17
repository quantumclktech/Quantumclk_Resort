export type LoyaltyVoucher = {
  code: string;
  tag: string;
  title: string;
  desc: string;
  value: string;
};

export default function LoyaltyCards({ vouchers }: { vouchers: LoyaltyVoucher[] }) {
  return (
    <div className="loyalty-cards-grid" role="list" aria-label="Membership Privileges & Deals">
      {vouchers.map((voucher) => (
        <article className="loyalty-voucher-card" key={voucher.code} role="listitem">
          <div className="voucher-card-top">
            <span className="voucher-tag">{voucher.tag}</span>
            <span className="voucher-code">{voucher.code}</span>
          </div>

          <h3 className="voucher-title">{voucher.title}</h3>
          <p className="voucher-desc">{voucher.desc}</p>

          <div className="voucher-card-footer">
            <span className="voucher-value">{voucher.value}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
