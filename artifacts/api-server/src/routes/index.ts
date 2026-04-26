import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import settingsRouter from "./settings";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(settingsRouter);
router.use(summaryRouter);

export default router;
