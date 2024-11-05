import assert from "http-assert-plus";

import { writeMessage } from "@/lib/service-messages";

export type EventStatus =
  | "STARTED"
  | "DEPENDENCIES"
  | "RUNNING"
  | "COMPLETED"
  | "CRASHED";

export interface WorkerRequestEvent {
  data?:
    | { action: "PREPARE" }
    | { id: string; action: "RUN"; filename: string; code: string }
    | { id: string; action: "STDIN"; input: string }
    | { action: "TEARDOWN" }
    | undefined;
}
export interface WorkerResponseEvent {
  data?:
    | { id: string; action: "STATUS"; status: EventStatus; data?: string }
    | { id: string; action: "STDIN"; prompt?: string }
    | { id: string; action: "STDOUT"; data: string }
    | { id: string; action: "STDERR"; data: string }
    | undefined;
}

interface IWorker {
  new (): Worker;
}

export default class ClientWorker {
  private WorkerClass: IWorker;
  private worker: Worker | undefined;

  private lock: Promise<void> | undefined;

  constructor(WorkerClass: IWorker) {
    this.WorkerClass = WorkerClass;
    this.worker = undefined;
  }

  setup() {
    this.worker = new this.WorkerClass();
    this.worker.postMessage({
      action: "PREPARE",
    } satisfies WorkerRequestEvent["data"]);
  }

  async run(
    {
      id,
      filename,
      code,
    }: {
      id: string;
      filename: string;
      code: string;
    },
    callbacks?: {
      onDebug?: (message: string) => void;
      onRunning?: () => void;
      onStdin?: (
        prompt: string | undefined,
        write: (input: string) => void
      ) => void;
      onStdout?: (data: string) => void;
      onStderr?: (data: string) => void;
      onCompleted?: (data?: string) => void;
      onException?: (err: string) => void;
    }
  ): Promise<void> {
    let releaseLock!: () => void;

    try {
      await this.lock;
      this.lock = new Promise<void>((resolve) => (releaseLock = resolve));
      assert(typeof releaseLock === "function", "Failed to secure worker lock");

      this.worker =
        this.worker !== undefined ? this.worker : new this.WorkerClass();

      this.worker.onmessage = (event: WorkerResponseEvent): void => {
        switch (event.data?.action) {
          case "STATUS": {
            const { status, data } = event.data;

            switch (status) {
              case "STARTED":
                return callbacks?.onDebug?.("Started");
              case "DEPENDENCIES":
                return callbacks?.onDebug?.("Loading dependencies");
              case "RUNNING":
                return callbacks?.onRunning?.();
              case "COMPLETED":
                return callbacks?.onCompleted?.(data);
              case "CRASHED":
                return callbacks?.onException?.(data ?? "An error occurred");
              default:
                return console.warn("Unknown event from worker:", status);
            }
          }

          case "STDIN": {
            const { prompt } = event.data;

            if (typeof callbacks?.onStdin === "function") {
              return callbacks.onStdin(prompt, (input: string) => {
                writeMessage(id, input).catch((err) =>
                  console.error("writeMessage", err)
                );
              });
            } else {
              writeMessage(id, "").catch((err) =>
                console.error("writeMessage", err)
              );
              return;
            }
          }

          case "STDOUT": {
            const { data } = event.data;
            return callbacks?.onStdout?.(data);
          }

          case "STDERR": {
            const { data } = event.data;
            return callbacks?.onStderr?.(data);
          }
        }
      };

      this.worker.postMessage({
        id,
        action: "RUN",
        filename,
        code,
      } satisfies WorkerRequestEvent["data"]);
    } catch (err) {
      callbacks?.onException?.((err as Error).message ?? "An error occurred");
    } finally {
      releaseLock();
    }
  }

  isRunning() {
    return this.lock !== undefined;
  }

  teardown() {
    this.worker?.terminate();
    this.worker = undefined;
  }
}
