package com.quantumclk.erp.access.employee;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByKeycloakUserId(UUID keycloakUserId);

    boolean existsByJobRoleAndStatusNot(String jobRole, String status);

    boolean existsByKeycloakUserId(UUID keycloakUserId);

    /** Row lock that skips rows another instance is already working on (no double provisioning). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
    @Query("select e from Employee e where e.id = :id")
    Optional<Employee> lockById(UUID id);

    @Query("select e.id from Employee e where e.status in :statuses order by e.updatedAt")
    List<UUID> idsWithStatus(Collection<String> statuses, org.springframework.data.domain.Pageable page);
}
