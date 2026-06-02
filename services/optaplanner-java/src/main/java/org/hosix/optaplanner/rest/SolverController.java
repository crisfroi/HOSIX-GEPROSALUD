package org.hosix.optaplanner.rest;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@RestController
public class SolverController {

  @PostMapping("/solve")
  public Map<String, Object> solve(@RequestBody Map<String, Object> problem) {
    // Skeleton: receive problem JSON and return a dummy solution.
    Map<String, Object> res = new HashMap<>();
    res.put("solution", "TODO implement using Timefold/OptaPlanner");
    res.put("inputSummary", problem == null ? null : problem.keySet());
    return res;
  }
}
