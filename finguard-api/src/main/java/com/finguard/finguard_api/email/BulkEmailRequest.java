package com.finguard.finguard_api.email;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BulkEmailRequest(
        @NotEmpty
        @Size(max = 200)
        List<@NotNull @Positive Long> recipientIds,

        @NotBlank
        @Size(max = 200)
        @Pattern(regexp = "^[^\\r\\n]*$", message = "Subject must be a single line")
        String subject,

        @NotBlank
        @Size(max = 5000)
        String body,

        boolean paymentReminder
) {
}
