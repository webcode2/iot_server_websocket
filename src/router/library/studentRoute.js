import { Router } from 'express';
import { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } from "../../controller/library_studentController.js";

const router = Router();

router.post('/', createStudent);
router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
