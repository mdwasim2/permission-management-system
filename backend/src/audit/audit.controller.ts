import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAuditLogs(@Req() request: Request) {
    return this.auditService.getAuditLogs(request);
  }
}
