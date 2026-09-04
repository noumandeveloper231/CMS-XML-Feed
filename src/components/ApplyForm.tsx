"use client";

import { useMemo, useState } from "react";
import {
  formatPhoneNumber,
  isCompletePhoneFormat,
  isValidUSPhoneNumber,
  isValidUSZip,
} from "@/lib/phoneValidation";
import { US_STATES } from "@/lib/usStates";

type Props = {
  recordNumber: string;
  jobTitle: string;
  salary?: string;
  applyEmail?: string;
};

type FormState = {
  fullName: string;
  Field_8: string;
  Field_11: string;
  Field_15: string;
  Field_17: string;
  Field_18: string;
  Field_19: string;
  notes: string;
  website: string;
};

const INITIAL: FormState = {
  fullName: "",
  Field_8: "",
  Field_11: "",
  Field_15: "",
  Field_17: "",
  Field_18: "",
  Field_19: "",
  notes: "",
  website: "",
};

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function ApplyForm({
  recordNumber,
  jobTitle,
  salary,
  applyEmail,
}: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  const roleLine = useMemo(() => {
    const title = jobTitle || "this position";
    const pay = salary ? ` – ${salary}` : "";
    const ref = recordNumber ? ` (Ref ${recordNumber})` : "";
    return `${title}${pay}${ref}`;
  }, [jobTitle, salary, recordNumber]);

  const setField = (name: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const onPhoneChange = (raw: string) => {
    setField("Field_11", formatPhoneNumber(raw));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const { first, last } = splitFullName(form.fullName);

    if (!first || !last) {
      errs.fullName = "Enter your full name (first and last).";
    }
    if (!form.Field_8.trim()) {
      errs.Field_8 = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Field_8.trim())) {
      errs.Field_8 = "Enter a valid email address.";
    }

    const phone = form.Field_11.trim();
    if (!phone) {
      errs.Field_11 = "Phone number is required.";
    } else if (!isCompletePhoneFormat(phone) || !isValidUSPhoneNumber(phone)) {
      errs.Field_11 =
        "Invalid phone. Use (###) ###-#### with a valid US area/exchange code.";
    }

    if (form.Field_19.trim() && !isValidUSZip(form.Field_19)) {
      errs.Field_19 = "Enter a valid US ZIP (12345 or 12345-6789).";
    }

    if (!resume) {
      errs.resume = "Resume is required.";
    } else if (resume.size > 10 * 1024 * 1024) {
      errs.resume = "Resume must be 10 MB or smaller.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const { first, last } = splitFullName(form.fullName);
    setIsSubmitting(true);
    try {
      const body = new FormData();
      body.set("Field_1", first);
      body.set("Field_3", last);
      body.set("Field_8", form.Field_8.trim());
      body.set("Field_11", form.Field_11.trim());
      body.set("Field_15", form.Field_15.trim());
      body.set("Field_17", form.Field_17.trim());
      body.set("Field_18", form.Field_18.trim());
      body.set("Field_19", form.Field_19.trim());
      body.set("notes", form.notes.trim());
      body.set("website", form.website);
      body.set("recordNumber", recordNumber);
      body.set("resume", resume!);

      const res = await fetch("/api/apply", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setError(
          data.message ||
            "You have already applied to this job. Duplicate applications are not allowed."
        );
        return;
      }

      if (!res.ok) {
        setError(
          data.message || "Failed to submit application. Please try again."
        );
        return;
      }

      setSuccess(data.message || "Application submitted successfully.");
      setForm(INITIAL);
      setResume(null);
      setFieldErrors({});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="apply-card">
      <h2 className="apply-card-title">Job Application</h2>
      <p className="apply-card-lead">
        You are applying for <strong>{roleLine}</strong>. Please complete the
        form below and attach your resume.
      </p>

      {success ? (
        <div className="apply-banner success" role="status">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="apply-banner error" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="apply-card-form" noValidate>
        <div className="apply-row two">
          <label className={fieldErrors.Field_8 ? "has-error" : ""}>
            <span>Email Address</span>
            <input
              type="email"
              name="Field_8"
              value={form.Field_8}
              onChange={(e) => setField("Field_8", e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {fieldErrors.Field_8 ? (
              <em className="field-error">{fieldErrors.Field_8}</em>
            ) : null}
          </label>
          <label className={fieldErrors.Field_11 ? "has-error" : ""}>
            <span>Phone Number</span>
            <input
              type="tel"
              name="Field_11"
              value={form.Field_11}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="(xxx) xxx-xxxx"
              maxLength={14}
              autoComplete="tel"
            />
            {fieldErrors.Field_11 ? (
              <em className="field-error">{fieldErrors.Field_11}</em>
            ) : null}
          </label>
        </div>

        <label className={fieldErrors.fullName ? "has-error" : ""}>
          <span>Full Name</span>
          <input
            name="fullName"
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
          />
          {fieldErrors.fullName ? (
            <em className="field-error">{fieldErrors.fullName}</em>
          ) : null}
        </label>

        <label>
          <span>Street Address</span>
          <input
            name="Field_15"
            value={form.Field_15}
            onChange={(e) => setField("Field_15", e.target.value)}
            placeholder="Your street address"
            autoComplete="street-address"
          />
        </label>

        <div className="apply-row two">
          <label>
            <span>City</span>
            <input
              name="Field_17"
              value={form.Field_17}
              onChange={(e) => setField("Field_17", e.target.value)}
              placeholder="Your city"
              autoComplete="address-level2"
            />
          </label>
          <label>
            <span>State</span>
            <select
              name="Field_18"
              value={form.Field_18}
              onChange={(e) => setField("Field_18", e.target.value)}
              autoComplete="address-level1"
            >
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="apply-row two">
          <label className={fieldErrors.Field_19 ? "has-error" : ""}>
            <span>Zip Code</span>
            <input
              name="Field_19"
              value={form.Field_19}
              onChange={(e) => setField("Field_19", e.target.value)}
              placeholder="Your zip code"
              autoComplete="postal-code"
              inputMode="numeric"
            />
            {fieldErrors.Field_19 ? (
              <em className="field-error">{fieldErrors.Field_19}</em>
            ) : null}
          </label>
          <label>
            <span>Cover note</span>
            <input
              name="notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Optional message"
            />
          </label>
        </div>

        <div className={`resume-box${fieldErrors.resume ? " has-error" : ""}`}>
          <span className="resume-label">Upload Resume *</span>
          <label className="resume-drop">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              required
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setResume(file);
                setFieldErrors((prev) => {
                  if (!prev.resume) return prev;
                  const next = { ...prev };
                  delete next.resume;
                  return next;
                });
              }}
            />
            <span className="resume-icon" aria-hidden>
              ▤
            </span>
            <span className="resume-file">
              {resume ? resume.name : "No file chosen"}
            </span>
            <span className="resume-hint">Required · Max. file size: 10 MB</span>
          </label>
          {fieldErrors.resume ? (
            <span className="field-error">{fieldErrors.resume}</span>
          ) : null}
        </div>

        <label className="hp-field" aria-hidden="true">
          <span>Website</span>
          <input
            name="website"
            value={form.website}
            onChange={(e) => setField("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>

        <button
          type="submit"
          className="apply-submit"
          disabled={isSubmitting || !recordNumber}
        >
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>

      {applyEmail ? (
        <p className="apply-email-fallback">
          Prefer email?{" "}
          <a
            href={`mailto:${applyEmail}?subject=${encodeURIComponent(
              `Application: ${jobTitle}`
            )}`}
          >
            Apply by email
          </a>
        </p>
      ) : null}
    </div>
  );
}
