CREATE TABLE lead (
    id UUID PRIMARY KEY,
    public_reference VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    checkin_date DATE NOT NULL,
    checkout_date DATE NOT NULL,
    room_category VARCHAR(100) NOT NULL,
    guest_count INT NOT NULL DEFAULT 2,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assigned_to VARCHAR(100),
    claimed_by VARCHAR(100),
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_claimed_by ON lead(claimed_by);
CREATE INDEX idx_lead_assigned_to ON lead(assigned_to);
CREATE INDEX idx_lead_status ON lead(status);
