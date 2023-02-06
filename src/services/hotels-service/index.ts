import hotelsRepository from "@/repositories/hotels-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { cannotListHotelsError } from "@/errors/cannot-list-hotels-error";
import { notFoundError } from "@/errors";

async function getAllHotels(userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

    if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw cannotListHotelsError();
    }

    const hotels = await hotelsRepository.findMany();
    if (!hotels) throw notFoundError();

    return hotels;
}


const hotelsService = {
    getAllHotels
};

export default hotelsService;