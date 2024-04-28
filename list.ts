"use server";
import { getAuthSession } from "@/lib/auth";
import { prismaDB } from "@/providers/connection";
import { createAudLog } from "./audit";
import { ACTION, TABLE_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createLists = async (data: { title: string; boardId: string }) => {
  const session = await getAuthSession();
  if (!session) {
    return {
      error: "user not found",
    };
  }
  const { title, boardId } = data;
  let list;
  try {
    const lastList = await prismaDB.list.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = lastList ? lastList?.order + 1 : 1;
    list = await prismaDB.list.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
    });
    console.log(list, "lastList");
    await createAudLog({
      tableId: list.id,
      tableTitle: list.title,
      tableType: TABLE_TYPE.LIST,
      action: ACTION.CREATE,
      orgId: "",
    });
  } catch (error) {
    return {
      error: "failed to create",
    };
  }
  revalidatePath("/");
  return { result: list };
};

// update list

export const updateList = async (data: {
    title: string;
    boardId: string;
    id: string;
  }) => {
    const { title, id, boardId } = data;
    let list;
  
    try {
      list = await prismaDB.list.update({
        where: {
          id,
          boardId,
        },
        data: {
          title,
        },
      });
  
      await createAudLog({
        tableId: list.id,
        tableTitle: list.title,
        tableType: TABLE_TYPE.LIST,
        action: ACTION.UPDATE,
        orgId: "",
      });
    } catch (error) {
      return {
        error: "Not updated",
      };
    }
  
    revalidatePath(`/board/${boardId}`);
    return { result: list };
  };
  
  // copy list
  
  export const listCopy = async (data: { id: string; boardId: string }) => {
    const session = await getAuthSession();
    if (!session) {
      return {
        error: "user not found",
      };
    }
    const { id, boardId } = data;
    let list;
    try {
      const listtoCopy = await prismaDB.list.findUnique({
        where: { id, boardId },
        include: {
          cards: true,
        },
      });
  