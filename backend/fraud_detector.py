import pandas as pd


# Known vendors in our demo dataset
KNOWN_VENDORS = {
    "ABC Supplies",
    "XYZ Logistics",
    "Global Tech",
    "Quick Services"
}

# Accounts that require additional verification
SUSPICIOUS_ACCOUNTS = {
    "ACC009",
    "ACC010",
    "ACC011"
}


def analyze_invoices(df):
    df = df.copy()

    # Convert date column
    df["invoice_date"] = pd.to_datetime(df["invoice_date"])

    # Average invoice amount for each vendor
    vendor_avg = df.groupby("vendor")["amount"].mean().to_dict()

    # Detect duplicate invoice IDs
    duplicate_ids = set(
        df[df["invoice_id"].duplicated(keep=False)]["invoice_id"]
    )

    # Count different vendors associated with each employee
    employee_vendor_count = (
        df.groupby("employee")["vendor"]
        .nunique()
        .to_dict()
    )

    results = []

    for _, row in df.iterrows():

        score = 0
        reasons = []

        invoice_id = row["invoice_id"]
        vendor = row["vendor"]
        employee = row["employee"]
        amount = float(row["amount"])
        approval_limit = float(row["approval_limit"])
        payment_account = row["payment_account"]

        # --------------------------------------------------
        # RULE 1: Duplicate invoice ID
        # --------------------------------------------------
        if invoice_id in duplicate_ids:
            score += 30
            reasons.append("Duplicate invoice ID detected")

        # --------------------------------------------------
        # RULE 2: Unknown vendor
        # --------------------------------------------------
        if vendor not in KNOWN_VENDORS:
            score += 25
            reasons.append("New or unknown vendor")

        # --------------------------------------------------
        # RULE 3: Amount significantly above vendor average
        # --------------------------------------------------
        average_amount = vendor_avg.get(vendor, amount)

        if amount > average_amount * 1.5:
            score += 25
            reasons.append(
                "Invoice amount is significantly above vendor average"
            )

        # --------------------------------------------------
        # RULE 4: Amount unusually close to approval limit
        # --------------------------------------------------
        if approval_limit > 0:
            ratio = amount / approval_limit

            if 0.95 <= ratio <= 1.0:
                score += 20
                reasons.append(
                    "Amount is unusually close to approval limit"
                )

        # --------------------------------------------------
        # RULE 5: Suspicious payment account
        # --------------------------------------------------
        if payment_account in SUSPICIOUS_ACCOUNTS:
            score += 20
            reasons.append(
                "Payment account requires verification"
            )

        # --------------------------------------------------
        # RULE 6: Employee linked to multiple vendors
        # --------------------------------------------------
        if employee_vendor_count.get(employee, 0) > 1:
            score += 10
            reasons.append(
                "Employee is associated with multiple vendors"
            )

        # Maximum score = 100
        score = min(score, 100)

        # --------------------------------------------------
        # Risk classification
        # --------------------------------------------------
        if score >= 50:
            risk_level = "HIGH"
        elif score >= 25:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # If nothing suspicious was detected
        if not reasons:
            reasons.append(
                "No major risk indicators detected"
            )

        results.append({
            "invoice_id": invoice_id,
            "vendor": vendor,
            "employee": employee,
            "amount": amount,
            "risk_score": score,
            "risk_level": risk_level,
            "reasons": reasons
        })

    return pd.DataFrame(results)