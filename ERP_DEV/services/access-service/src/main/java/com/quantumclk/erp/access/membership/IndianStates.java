package com.quantumclk.erp.access.membership;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * The 28 states and 8 union territories of India, for the member's address (D-133). The staff ERP shows the same
 * list (web/src/smartFields.ts INDIAN_STATES); Karnataka is the default there (the resort is in Karnataka).
 */
final class IndianStates {

    static final List<String> ALL = List.of(
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
            "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
            "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry");

    private IndianStates() { }

    /** The canonical spelling of a state or UT, ignoring case and surrounding spaces. */
    static Optional<String> find(String raw) {
        if (raw == null) return Optional.empty();
        String s = raw.strip().toLowerCase(Locale.ROOT);
        return ALL.stream().filter(n -> n.toLowerCase(Locale.ROOT).equals(s)).findFirst();
    }
}
