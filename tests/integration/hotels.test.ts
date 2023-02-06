import app, { init } from "@/app";
import { createdHotel, createEnrollmentWithAddress,createPayment,createTicket,createTicketTypeIsRemote,createTicketTypeWithHotel, createUser, createTicketType, generateCreditCardData } from "../factories";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import * as jwt from "jsonwebtoken";
import { cleanDb, generateValidToken } from "../helpers";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/config";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const api = supertest(app);

describe("GET /hotels", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await api.get("/hotels");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });


    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();

        const token = jwt.sign({userId: userWithoutSession.id}, process.env.JWT_SECRET);

        const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 200 and a list of hotels", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const createHotel = await createdHotel();

            const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual([
                {
                    id: createHotel.id,
                    name: createHotel.name,
                    image: createHotel.image,
                    createdAt: createHotel.createdAt.toISOString(),
                    updatedAt: createHotel.updatedAt.toISOString()
                }
            ]);
        });

        it("should respond with status 200 and an empty list", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual([]);
        });

        it("should respond with status 402 when user ticket is remote", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it("should respond with status 404 when the user has no enrollment", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const ticketType = await createTicketTypeIsRemote();

            const response = await api.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
    });

describe("GET /hotels/:hotelId", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await api.get("/hotels/1");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {
        it("should respond with status 200 and a list of hotels with rooms", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const createHotel = await createdHotel();
            const createRoom = await prisma.room.create({
                data: {
                    name: "10 20",
                    capacity: 3,
                    hotelId: createHotel.id
                }
            });

            const response = await api.get(`/hotels/${createHotel.id}`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual(
                {
                    id: createHotel.id,
                    name: createHotel.name,
                    image: createHotel.image,
                    createdAt: createHotel.createdAt.toISOString(),
                    updatedAt: createHotel.updatedAt.toISOString(),
                    Rooms: [{
                        id: createRoom.id,
                        name: createRoom.name,
                        capacity: createRoom.capacity,
                        hotelId: createHotel.id,
                        createdAt: createRoom.createdAt.toISOString(),
                        updatedAt: createRoom.updatedAt.toISOString()
                    }]
                }
            );
        })

        it("should respond with status 200 and a list of hotels with no rooms", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const createHotel = await createdHotel();

            const response = await api.get(`/hotels/${createHotel.id}`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual(
                {
                    id: createHotel.id,
                    name: createHotel.name,
                    image: createHotel.image,
                    createdAt: createHotel.createdAt.toISOString(),
                    updatedAt: createHotel.updatedAt.toISOString(),
                    Rooms: []
                }
            );
        });

        it("should respond with status 402 when user ticket is remote", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeIsRemote();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it("should respond with status 404 when the user has no enrollment", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const ticketType = await createTicketTypeIsRemote();

            const response = await api.get("/hotels/1").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
        it("should respond with status 404 hotel id not valid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const createHotel = await createdHotel();
    
            const response = await api.get(`/hotels/100`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
    });
});
});