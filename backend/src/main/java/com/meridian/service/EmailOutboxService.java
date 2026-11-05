package com.meridian.service;

import com.meridian.dto.SentEmailDto;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class EmailOutboxService {

    private final List<SentEmailDto> sentEmails = new CopyOnWriteArrayList<>();

    public void record(String id, String to, String subject, String type, String actionUrl,
                       String previewText, String deliveredVia) {
        SentEmailDto email = new SentEmailDto(
                id,
                to,
                subject,
                type,
                actionUrl,
                previewText,
                deliveredVia,
                LocalDateTime.now()
        );
        sentEmails.add(0, email); // newest first
        if (sentEmails.size() > 50) {
            sentEmails.remove(sentEmails.size() - 1);
        }
    }

    public List<SentEmailDto> getRecentEmails() {
        return Collections.unmodifiableList(sentEmails);
    }
}

