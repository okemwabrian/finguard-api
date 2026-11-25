package com.finguard.finguard_api.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        StringBuilder details = new StringBuilder();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
            if (!details.isEmpty()) details.append("; ");
            details.append(fieldError.getField()).append(": ").append(fieldError.getDefaultMessage());
        }
        String message = details.isEmpty()
                ? "Please verify your inputs and correct the highlighted fields."
                : "Validation failed — " + details;
        return ResponseEntity.badRequest().body(
                ApiErrorResponse.ofValidation(
                        400,
                        "VALIDATION_FAILED",
                        message,
                        errors
                )
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "State conflict occurred.";
        if (msg.toLowerCase().contains("rate limit")) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    ApiErrorResponse.of(429, "RATE_LIMITED", msg)
            );
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiErrorResponse.of(409, "CONFLICT", msg)
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Invalid argument passed.";
        int status = msg.toLowerCase().contains("not found") ? 404 : 400;
        String code = status == 404 ? "NOT_FOUND" : "BAD_REQUEST";
        return ResponseEntity.status(status).body(
                ApiErrorResponse.of(status, code, msg)
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                ApiErrorResponse.of(401, "INVALID_CREDENTIALS", "Invalid email or password. Please verify your credentials.")
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiErrorResponse.of(403, "ACCESS_DENIED", ex.getMessage() != null ? ex.getMessage() : "You do not have permission to perform this action.")
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        return ResponseEntity.status(status).body(
                ApiErrorResponse.of(status.value(), "REQUEST_FAILED", ex.getReason() != null ? ex.getReason() : "Request failed.")
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiErrorResponse.of(400, "FILE_TOO_LARGE", "Uploaded file exceeds maximum allowed limit of 10MB.")
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                ApiErrorResponse.of(409, "DATA_INTEGRITY_VIOLATION", "This record is linked to existing loans or audit records and cannot be deleted. Consider suspending it instead.")
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception caught: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiErrorResponse.of(500, "INTERNAL_ERROR", "Our service encountered a temporary error. Please try again shortly or contact support.")
        );
    }
}
