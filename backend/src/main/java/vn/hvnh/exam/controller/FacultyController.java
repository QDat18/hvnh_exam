// package vn.hvnh.exam.controller;

// import lombok.RequiredArgsConstructor;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import vn.hvnh.exam.entity.sql.Faculty;
// import vn.hvnh.exam.service.FacultyService;

// import java.util.List;
// import java.util.UUID; 

// @RestController
// @RequestMapping("/api/faculties")
// @RequiredArgsConstructor
// public class FacultyController {
//     private final FacultyService facultyService;

//     @GetMapping
//     public ResponseEntity<List<Faculty>> getAllFaculties() {
//         return ResponseEntity.ok(facultyService.getAllFaculties());
//     }

//     @PostMapping
//     public ResponseEntity<Faculty> createFaculty(@RequestBody Faculty faculty) {
//         return ResponseEntity.ok(facultyService.createFaculty(faculty));
//     }
// }