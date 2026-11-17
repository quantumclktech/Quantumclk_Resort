package com.quantumclk.erp.guest.web;

import java.time.Instant;
import java.util.Map;

/** The one error body every endpoint returns (docs/02-architecture/api.md §1). */
public record ApiError(String code, String message, int status, String correlationId, Instant timestamp,
                       Map<String, String> fields) {

    public static ApiError of(String code, String message, int status, String correlationId) {
        return new ApiError(code, message, status, correlationId, Instant.now(), Map.of());
    }
}
