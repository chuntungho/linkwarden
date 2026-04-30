export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrationWorker } = await import("./lib/migrationWorker");
    await migrationWorker();
  }
}
