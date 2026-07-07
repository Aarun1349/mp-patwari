export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReaper } = await import("@/lib/exam/reaper");
    startReaper();
  }
}
