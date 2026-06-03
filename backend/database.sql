CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100) UNIQUE,
    invoice_date DATE,
    total_amount NUMERIC(12,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    file_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON invoices (vendor_name);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices (invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_at ON invoices (uploaded_at DESC);
