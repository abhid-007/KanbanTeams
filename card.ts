"use server";

import { getAuthSession } from "@/lib/auth";
import { prismaDB } from "@/providers/connection";
import { createAudLog } from "./audit";
import { ACTION, TABLE_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Card, UpdateCard, User } from "@/interfaces";

export const cardCreate = async (data: {
  title: string;
  listId: string;
  boardId: string;
}) => {
  const session = await getAuthSession();
  if (!session) {
    return {
      error: "user not found",
    };
  }
  const { title, listId, boardId } = data;
  let card;

  try {
    const list = await prismaDB.list.findUnique({
      where: { id: listId },
    });
    if (!list) {
      return {
        error: "List not found",
      };
    }

    const lastCard = await prismaDB.card.findFirst({
      where: { listId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = lastCard ? lastCard.order + 1 : 1;
    card = await prismaDB.card.create({
      data: {
        title,
        listId,
        boardId,
        order,
      },
    });

