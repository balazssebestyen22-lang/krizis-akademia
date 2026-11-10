export default {
  datasource: {
    url: `file:${process.cwd()}/prisma/dev.db`,
  },
  schema: "./prisma/schema.prisma",
}
