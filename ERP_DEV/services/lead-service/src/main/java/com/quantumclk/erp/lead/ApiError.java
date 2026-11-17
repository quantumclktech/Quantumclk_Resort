package com.quantumclk.erp.lead;

import java.time.Instant;
import java.util.Map;

public record ApiError(String code, String message, int status, String correlationId, Instant timestamp,
                       Map<String, String> fields) {

    public static ApiError of(String code, String message, int status, String correlationId) {
        return new ApiError(code, message, status, correlationId, Instant.now(), Map.of());
    }
}
