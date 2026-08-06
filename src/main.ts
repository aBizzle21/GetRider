import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  Module, Controller, Post, Get, Body, Query, Res, Req,
  HttpException, HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  initSchema, upsertResult, allResults, summary, IncomingResult,
} from './db';
import { DASHBOARD_HTML } from './dashboard';

const INGEST_TOKEN = process.env.INGEST_TOKEN || '';

function checkToken(provided?: string) {
  if (!INGEST_TOKEN) return; // token unset → open (dev only); we warn at boot
  if (provided !== INGEST_TOKEN) {
    throw new HttpException('bad token', HttpStatus.UNAUTHORIZED);
  }
}

function toCsv(rows: any[]): string {
  const cols = [
    'tester_name','tag','device','role','wave','group_name','test_id','test_text',
    'verdict','severity','recording','notes','logged_at','received_at',
  ];
  const cell = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(',')]
    .concat(rows.map((r) => cols.map((c) => cell(r[c])).join(',')))
    .join('\r\n');
}

@Controller()
class AppController {
  // ---- health ----
  @Get('/')
  health() {
    return { ok: true, service: 'getrider-breakit', dashboard: '/dashboard?token=YOUR_TOKEN' };
  }

  // ---- ingest: one result per call (the app dual-writes here) ----
  @Post('/breakit')
  async ingest(@Body() body: IncomingResult, @Query('token') qToken: string, @Req() req: Request) {
    const token = qToken || (req.headers['x-ingest-token'] as string);
    checkToken(token);
    if (!body || !body.tester_key || !body.test_id || !body.verdict) {
      throw new HttpException('missing fields', HttpStatus.BAD_REQUEST);
    }
    await upsertResult(body);
    return { ok: true };
  }

  // ---- optional batch (retry queue can flush many at once) ----
  @Post('/breakit/batch')
  async ingestBatch(@Body() body: { results: IncomingResult[] }, @Query('token') qToken: string, @Req() req: Request) {
    const token = qToken || (req.headers['x-ingest-token'] as string);
    checkToken(token);
    const items = Array.isArray(body?.results) ? body.results : [];
    let n = 0;
    for (const r of items) {
      if (r && r.tester_key && r.test_id && r.verdict) { await upsertResult(r); n++; }
    }
    return { ok: true, saved: n };
  }

  // ---- live dashboard (browser) ----
  @Get('/dashboard')
  dashboard(@Query('token') token: string, @Res() res: Response) {
    checkToken(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(DASHBOARD_HTML);
  }

  // ---- JSON feed the dashboard polls ----
  @Get('/api/summary')
  async apiSummary(@Query('token') token: string) {
    checkToken(token);
    return await summary();
  }

  // ---- exports for the India team ----
  @Get('/export.csv')
  async exportCsv(@Query('token') token: string, @Res() res: Response) {
    checkToken(token);
    const rows = await allResults();
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="breakit_all_${stamp}.csv"`);
    res.send(toCsv(rows));
  }

  @Get('/export.json')
  async exportJson(@Query('token') token: string, @Res() res: Response) {
    checkToken(token);
    const rows = await allResults();
    const payload = {
      schema: 'getrider.breakit.consolidated.v1',
      exported_at: new Date().toISOString(),
      count: rows.length,
      results: rows,
    };
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="breakit_all_${stamp}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  }
}

@Module({ controllers: [AppController] })
class AppModule {}

async function bootstrap() {
  await initSchema();
  const app = await NestFactory.create(AppModule);
  // Testers post from a home-screen origin / file — allow cross-origin.
  app.enableCors({ origin: true, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'x-ingest-token'] });
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  if (!INGEST_TOKEN) {
    // eslint-disable-next-line no-console
    console.warn('⚠  INGEST_TOKEN is not set — the endpoint is OPEN. Set it in Railway Variables before handing out the app.');
  }
  // eslint-disable-next-line no-console
  console.log(`GetRider break-it server listening on :${port}`);
}
bootstrap();
