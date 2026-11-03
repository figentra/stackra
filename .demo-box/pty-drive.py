"""Runs a command on a 100x30 pseudo-terminal, answering prompts: argv is the command, then pairs of
(text to wait for, keys to send). Prints the screen output with escape sequences stripped, then the exit code."""
import fcntl, os, pty, re, select, struct, sys, termios, time

command, steps = sys.argv[1], sys.argv[2:]
pairs = list(zip(steps[0::2], steps[1::2]))
pid, fd = pty.fork()
if pid == 0:
    os.execvp("bash", ["bash", "-c", command])
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 30, 100, 0, 0))
os.kill(pid, 28)  # SIGWINCH, so the child reads the size
seen, output = "", b""
deadline = time.time() + 30
while time.time() < deadline:
    ready, _, _ = select.select([fd], [], [], 0.2)
    if ready:
        try:
            chunk = os.read(fd, 65536)
        except OSError:
            break
        if not chunk:
            break
        output += chunk
        seen += chunk.decode("utf-8", "replace")
    if pairs and pairs[0][0] in re.sub(r"\x1b\[[0-9;?]*[A-Za-z]", "", seen):
        time.sleep(0.4)
        os.write(fd, pairs[0][1].encode().decode("unicode_escape").encode())
        seen = ""
        pairs.pop(0)
done, status = os.waitpid(pid, os.WNOHANG)
if done == 0:
    # Still running at the deadline (a prompt nobody answered): stop it rather than wait forever.
    os.kill(pid, 15)
    time.sleep(1)
    done, status = os.waitpid(pid, os.WNOHANG)
    if done == 0:
        os.kill(pid, 9)
        _, status = os.waitpid(pid, 0)
text = output.decode("utf-8", "replace").replace("\r", "")
# Cursor moves become line breaks, so each redraw reads as one frame; colours are dropped.
text = re.sub(r"\x1b\[[0-9]*[ABEFGHJK]", "\n", text)
text = re.sub(r"\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07", "", text)
lines = [line.rstrip() for line in text.split("\n")]
collapsed = [line for i, line in enumerate(lines) if line.strip() and (i == 0 or line != lines[i - 1])]
print("\n".join(collapsed[-70:]))
print(f"[exit {os.waitstatus_to_exitcode(status)}]")
if pairs:
    print(f"(never saw: {pairs[0][0]!r}; the raw tail was {seen[-400:]!r})")
