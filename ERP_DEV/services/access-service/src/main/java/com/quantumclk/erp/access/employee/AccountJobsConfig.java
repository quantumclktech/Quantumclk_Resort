package com.quantumclk.erp.access.employee;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
class AccountJobsConfig {
    @Bean
    AccountJobs.BootstrapAdmin bootstrapAdmin(@Value("${erp.bootstrap-admin.email:}") String email,
                                              @Value("${erp.bootstrap-admin.username:}") String username,
                                              @Value("${erp.bootstrap-admin.first-name:}") String firstName,
                                              @Value("${erp.bootstrap-admin.last-name:}") String lastName,
                                              @Value("${erp.bootstrap-admin.mobile:}") String mobile) {
        return new AccountJobs.BootstrapAdmin(email, username, firstName, lastName, mobile);
    }
}
