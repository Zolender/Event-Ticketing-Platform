"use client";

import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { VisibilityIcon, VisibilityOffIcon } from "./icons";
import { TextField } from "./text-field";

type PasswordFieldProps = Omit<
  ComponentProps<typeof TextField>,
  "type" | "trailing"
>;

/** A text field for passwords, with a show/hide button and a Caps Lock warning. */
export function PasswordField({
  onKeyUp,
  warning,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  function handleKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
    onKeyUp?.(event);
  }

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      onKeyUp={handleKeyUp}
      warning={capsLock ? "Caps Lock is on." : warning}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={props.id}
          className="grid size-12 cursor-pointer place-items-center rounded-full text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </button>
      }
    />
  );
}
