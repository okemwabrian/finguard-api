package com.finguard.finguard_api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_LOANS = "loans";
    public static final String CACHE_MY_LOANS = "my_loans";
    public static final String CACHE_LOAN_DETAILS = "loan_details";
    public static final String CACHE_LOAN_STATS = "loan_stats";
    public static final String CACHE_ADMIN_USERS = "admin_users";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000)
                .recordStats());
        cacheManager.setCacheNames(List.of(
                CACHE_LOANS,
                CACHE_MY_LOANS,
                CACHE_LOAN_DETAILS,
                CACHE_LOAN_STATS,
                CACHE_ADMIN_USERS
        ));
        return cacheManager;
    }
}
