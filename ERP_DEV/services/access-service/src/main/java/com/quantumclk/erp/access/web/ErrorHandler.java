package com.quantumclk.erp.access.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** Maps exceptions to the shared error body; never leaks stack traces or internals to clients. */
@RestControllerAdvice
public class ErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(ErrorHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_FAILED", "Some fields are invalid.", 400,
                CorrelationIdFilter.current(), Instant.now(), fields));
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> api(ApiException e) {
        if (e instanceof FieldErrorsException f) {
            return ResponseEntity.badRequest().body(new ApiError(f.code, f.getMessage(), 400, CorrelationIdFilter.current(),
                    Instant.now(), f.fields));
        }
        return body(e.status, e.code, e.getMessage());
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> tooLarge(org.springframework.web.multipart.MaxUploadSizeExceededException e) {
        return body(HttpStatus.PAYLOAD_TOO_LARGE, "PAYLOAD_TOO_LARGE", "The upload is too large (at most 5 MB).");
    }

    @ExceptionHandler(org.springframework.security.authorization.AuthorizationDeniedException.class)
    ResponseEntity<ApiError> denied(org.springframework.security.authorization.AuthorizationDeniedException e) {
        return body(HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not have permission to do this.");
    }

    @ExceptionHandler(org.springframework.web.bind.MissingRequestHeaderException.class)
    ResponseEntity<ApiError> missingHeader(org.springframework.web.bind.MissingRequestHeaderException e) {
        return body(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Missing header: " + e.getHeaderName());
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> unreadable(org.springframework.http.converter.HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "The request body is not valid JSON for this endpoint.");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> notFound(NoResourceFoundException e) {
        return body(HttpStatus.NOT_FOUND, "NOT_FOUND", "Not found.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception e) {
        log.error("Unhandled error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Something went wrong. Quote the correlation id when reporting it.");
    }

    static ResponseEntity<ApiError> body(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(ApiError.of(code, message, status.value(), CorrelationIdFilter.current()));
    }
}
