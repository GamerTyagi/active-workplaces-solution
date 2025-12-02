import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Query,
} from "@nestjs/common";
import { Workplace } from "@prisma/client";
import { Request } from "express";

import { nextLink, omitShard, PaginationPage } from "../shared/pagination";
import {
  type Page,
  PaginatedResponse,
  type Response,
} from "../shared/shared.types";
import { type CreateWorkplace, WorkplaceDTO } from "./workplaces.schemas";
import { WorkplacesService } from "./workplaces.service";

@Controller("workplaces")
export class WorkplacesController {
  constructor(private readonly service: WorkplacesService) {}

  /**
   * ⭐ Most active workplaces FIRST (to avoid conflict with /:id)
   */
  @Get("most-active")
  async getMostActive(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr) : 10;
    const data = await this.service.getMostActive({ from, to, limit });
    return { data };
  }

  /**
   * Creates a new workplace
   */
  @Post()
  async create(@Body() data: CreateWorkplace): Promise<Response<Workplace>> {
    return { data: await this.service.create(data) };
  }

  /**
   * Retrieves a workplace by ID
   */
  @Get("/:id")
  async getById(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<Response<WorkplaceDTO>> {
    const data = await this.service.getById(id);
    if (!data) {
      throw new Error(`ID ${id} not found.`);
    }

    return { data: omitShard(data) };
  }

  /**
   * Retrieves a paginated list of workplaces
   */
  @Get()
  async get(
    @Req() request: Request,
    @PaginationPage() page: Page,
  ): Promise<PaginatedResponse<WorkplaceDTO>> {
    const { data, nextPage } = await this.service.get({ page });

    return {
      data: data.map(omitShard),
      links: { next: nextLink({ nextPage, request }) },
    };
  }
}
