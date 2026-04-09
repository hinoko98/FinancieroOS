import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  async connect() {
    await this.$connect();
  }

  async disconnect() {
    await this.$disconnect();
  }
}
