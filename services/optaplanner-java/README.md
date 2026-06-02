OptaPlanner (Timefold) microservice skeleton

This folder contains a minimal skeleton for a Java Spring Boot microservice using Timefold/OptaPlanner.
It is a template the team can use to implement full optimization logic. Building and running requires Java 17+ and Maven.

Structure:
- pom.xml : Maven configuration (Timefold/OptaPlanner dependencies)
- src/main/java/org/hosix/optaplanner/Application.java : Spring Boot entry
- src/main/java/org/hosix/optaplanner/rest/SolverController.java : /solve endpoint
- src/main/java/org/hosix/optaplanner/domain/* : domain classes (Patient, Clinician, Assignment)

Notes:
- This is a skeleton and not runnable as-is until the domain and constraints are implemented.
- Consider Timefold Cloud or self-hosted Timefold for production.

Build:
  mvn -U package
Run:
  java -jar target/optaplanner-service.jar
