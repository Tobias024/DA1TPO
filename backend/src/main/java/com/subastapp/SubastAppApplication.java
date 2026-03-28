package com.subastapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SubastAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(SubastAppApplication.class, args);
    }
}
