from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
import io

from fraud_detector import analyze_invoices


app = FastAPI(
    title="Invoice Fraud Investigator API",
    description="Explainable invoice fraud risk analysis API",
    version="1.0"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                       "http://127.0.0.1:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# LOAD DEMO DATA
# ---------------------------------------------------------

DEFAULT_DATA_PATH = "data/invoices.csv"


def process_dataframe(df):

    results = analyze_invoices(df)

    # Convert dataframe into JSON-friendly format
    records = results.to_dict(orient="records")

    for record in records:
        record["amount"] = float(record["amount"])
        record["risk_score"] = int(record["risk_score"])

    return records


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "online",
        "message": "Invoice Fraud Investigator API"
    }


# ---------------------------------------------------------
# DEFAULT INVOICES
# ---------------------------------------------------------

@app.get("/api/invoices")
def get_invoices():

    df = pd.read_csv(DEFAULT_DATA_PATH)

    results = process_dataframe(df)

    return {
        "success": True,
        "count": len(results),
        "invoices": results
    }


# ---------------------------------------------------------
# SINGLE INVOICE
# ---------------------------------------------------------

@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str):

    df = pd.read_csv(DEFAULT_DATA_PATH)

    results = analyze_invoices(df)

    invoice = results[
        results["invoice_id"] == invoice_id
    ]

    if invoice.empty:

        return {
            "success": False,
            "message": "Invoice not found"
        }

    record = invoice.iloc[0].to_dict()

    record["amount"] = float(record["amount"])
    record["risk_score"] = int(record["risk_score"])

    return {
        "success": True,
        "invoice": record
    }


# ---------------------------------------------------------
# UPLOAD CSV
# ---------------------------------------------------------

@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        required_columns = {
            "invoice_id",
            "vendor",
            "employee",
            "amount",
            "invoice_date",
            "payment_account",
            "approval_limit",
        }

        missing_columns = required_columns - set(df.columns)

        if missing_columns:
            return {
                "success": False,
                "message": f"Missing columns: {', '.join(missing_columns)}"
            }

        # Save uploaded dataset as the active dataset
        df.to_csv(DEFAULT_DATA_PATH, index=False)

        results = process_dataframe(df)

        return {
            "success": True,
            "filename": file.filename,
            "count": len(results),
            "invoices": results
        }

    except Exception as error:
        return {
            "success": False,
            "message": str(error)
        }

# ---------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------

@app.get("/api/summary")
def get_summary():

    df = pd.read_csv(DEFAULT_DATA_PATH)

    results = analyze_invoices(df)

    high = len(
        results[
            results["risk_level"] == "HIGH"
        ]
    )

    medium = len(
        results[
            results["risk_level"] == "MEDIUM"
        ]
    )

    low = len(
        results[
            results["risk_level"] == "LOW"
        ]
    )

    total_amount = float(
        results["amount"].sum()
    )

    high_risk_amount = float(
        results[
            results["risk_level"] == "HIGH"
        ]["amount"].sum()
    )

    return {
        "total_invoices": len(results),
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "total_amount": total_amount,
        "high_risk_amount": high_risk_amount
    }