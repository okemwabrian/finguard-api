package com.finguard.finguard_api.loan;

public enum LoanStatus {
    PENDING,
    UNDER_REVIEW,
    APPROVED,
    REJECTED;

    public boolean canTransitionTo(LoanStatus next) {
        return switch (this) {
            case PENDING -> next == UNDER_REVIEW;
            case UNDER_REVIEW -> next == APPROVED || next == REJECTED;
            case APPROVED, REJECTED -> false; // Terminal states
        };
    }
}
