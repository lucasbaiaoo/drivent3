import { prisma } from "@/config";

async function findMany() {
    return prisma.hotel.findMany();
}

async function findById(hotelId: number) {
    return prisma.hotel.findFirst({
        where:{
            id: hotelId
        },
        include:{
            Rooms:true
        }
    });
}

const hotelRepository = {
    findMany,
    findById
};

export default hotelRepository