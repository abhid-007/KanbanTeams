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

    await createAudLog({
        tableId: card.id,
        tableTitle: card.title,
        tableType: TABLE_TYPE.CARD,
        action: ACTION.CREATE,
        orgId: "",
      });
    } catch (error) {
      return {
        error: "card not created",
      };
    }
    revalidatePath(`/board/${boardId}`);
    return { result: card };
  };
  
  // udpate card
  export const updateDard = async (data: z.infer<typeof UpdateCard>) => {
    const session = await getAuthSession();
    if (!session) {
      return {
        error: "user not found",
      };
    }
    const { boardId, id, ...values } = data;
    let card;
    try {
      card = await prismaDB.card.update({
        where: { id },
        data: { ...values },
      });
  
      await createAudLog({
        tableId: card.id,
        tableTitle: card.title,
        tableType: TABLE_TYPE.CARD,
        action: ACTION.UPDATE,
        orgId: "",
      });
    } catch (error) {
      return {
        error: "card not updated",
      };
    }
    revalidatePath(`/board/${boardId}`);
    return { result: card };
  };
  
  // copy card
  export const CardCopy = async (data: { id: string; boardId: string }) => {
    const session = await getAuthSession();
    if (!session) {
      return {
        error: "user not found",
      };
    }
  
    const { id, boardId } = data;
    let card;
  
    try {
      const getCard = await prismaDB.card.findUnique({ where: { id } });
  
      if (!getCard) {
        return {
          error: "card not exist",
        };
      }
      const lastCard = await prismaDB.card.findFirst({
        where: { listId: getCard?.listId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const order = lastCard ? lastCard.order + 1 : 1;
      console.log(lastCard);
      card = await prismaDB.card.create({
        data: {
          title: `${getCard?.title} - copy`,
          description: getCard?.description,
          listId: getCard.listId,
          boardId,
          order,
        },
      });
  
      await createAudLog({
        tableId: card.id,
        tableTitle: card.title,
        tableType: TABLE_TYPE.CARD,
        action: ACTION.CREATE,
        orgId: "",
      });
    } catch (error) {
      return {
        error: "card not created",
      };
    }
    revalidatePath(`/board/${boardId}`);
    return { result: card };
  };
  