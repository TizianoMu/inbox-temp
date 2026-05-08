import { useState, useEffect, useRef, useCallback } from "react";
import {
  POLL_INTERVAL,
  sleep,
  loadSavedAccounts,
  saveAccount,
  clearAccount,
  getToken,
  createAccount,
  fetchMessages,
} from "../api/mailApi";

export function useMailbox(domains, index, triggerKey) {
  const [address, setAddress] = useState(null);
  const [token, setToken] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [restored, setRestored] = useState(false);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const nextPollRef = useRef(null);

  useEffect(() => {
    if (!domains || domains.length === 0) return;
    let cancelled = false;

    setStatus("waiting");
    setError(null);
    setAddress(null);
    setToken(null);
    setMessages([]);
    setPolling(false);
    setLastUpdate(null);
    setCountdown(null);
    setRestored(false);
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);

    async function init() {
      const saved = loadSavedAccounts();
      const savedAcc = saved[index];

      if (savedAcc) {
        if (cancelled) return;
        setStatus("loading");
        try {
          const tok = await getToken(savedAcc.address, savedAcc.password);
          if (cancelled) return;
          setAddress(savedAcc.address);
          setToken(tok);
          setRestored(true);
          setStatus("ready");
          return;
        } catch {
          clearAccount(index);
        }
      }

      await sleep(index * 2000);
      if (cancelled) return;
      setStatus("loading");
      try {
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const acc = await createAccount(domain);
        if (cancelled) return;
        saveAccount(index, acc.address, acc.password);
        setAddress(acc.address);
        setToken(acc.token);
        setRestored(false);
        setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setStatus("error");
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [domains, index, triggerKey]);

  const poll = useCallback(async () => {
    if (!token) return;
    setPolling(true);
    try {
      const msgs = await fetchMessages(token);
      if (msgs !== null) {
        setMessages(msgs);
        setLastUpdate(new Date());
      }
    } catch (_) {}
    finally {
      setPolling(false);
      nextPollRef.current = Date.now() + POLL_INTERVAL;
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    nextPollRef.current = Date.now() + POLL_INTERVAL;
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [poll, token]);

  useEffect(() => {
    if (!token) return;
    countdownRef.current = setInterval(() => {
      if (nextPollRef.current) {
        const secs = Math.max(0, Math.round((nextPollRef.current - Date.now()) / 1000));
        setCountdown(secs);
      }
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [token]);

  return { address, token, messages, status, error, polling, lastUpdate, countdown, restored };
}
