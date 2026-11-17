package com.quantumclk.erp.guest.web;

import org.springframework.http.HttpStatus;

/** A deliberate, user-facing error: the status, code and message go to the client as-is (api.md §1). */
public class ApiException extends RuntimeException {
    public final HttpStatus status;
    public final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
