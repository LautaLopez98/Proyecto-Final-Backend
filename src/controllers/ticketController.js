import { logger } from "../logger.js";
import { ticketService } from "../services/ticketService.js";

export class TicketController {
    static createTicket = async (req, res) => {
        try {
            const newTicket = await ticketService.createTicket()
            res.json({newTicket});
        } catch (error) {
            logger.error("Error al crear el ticket", error);
            res.status(500).json({error: error.message});
        }
    }
}