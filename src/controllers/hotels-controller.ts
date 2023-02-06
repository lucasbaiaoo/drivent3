import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getAllHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

    try {
      const hotels = await hotelsService.getAllHotels(Number(userId));
      return res.status(httpStatus.OK).send(hotels);
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.sendStatus(httpStatus.NOT_FOUND)
      }
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED)
    }
  }