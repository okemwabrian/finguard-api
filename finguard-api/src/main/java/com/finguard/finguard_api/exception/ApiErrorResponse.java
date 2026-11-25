package com.finguard.finguard_api.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String errorCode,
        String error,
        String message,
        Map<String, String> fieldErrors
) {
    public static ApiErrorResponse of(int status, String errorCode, String message) {
        return new ApiErrorResponse(LocalDateTime.now(), status, errorCode, errorCode, message, null);
    }

    public static ApiErrorResponse ofValidation(int status, String errorCode, String message, Map<String, String> fieldErrors) {
        return new ApiErrorResponse(LocalDateTime.now(), status, errorCode, errorCode, message, fieldErrors);
    }
}
