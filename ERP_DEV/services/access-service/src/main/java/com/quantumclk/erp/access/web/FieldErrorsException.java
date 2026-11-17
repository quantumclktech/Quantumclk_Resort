package com.quantumclk.erp.access.web;

import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

/** 400 VALIDATION_FAILED with a message per field, for checks that bean validation can't express (api.md §1). */
public class FieldErrorsException extends ApiException {
    public final Map<String, String> fields;

    public FieldErrorsException(Map<String, String> fields) {
        super(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Some fields are invalid.");
        this.fields = new LinkedHashMap<>(fields);
    }
}
