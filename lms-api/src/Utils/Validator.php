<?php

namespace App\Utils;

class Validator
{
    private array $errors = [];
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function required(array $fields): self
    {
        foreach ($fields as $field) {
            if (!isset($this->data[$field])) {
                $this->errors[$field][] = ucfirst($field) . ' is required';
            } elseif (is_string($this->data[$field]) && trim($this->data[$field]) === '') {
                $this->errors[$field][] = ucfirst($field) . ' is required';
            } elseif (is_array($this->data[$field]) && empty($this->data[$field])) {
                $this->errors[$field][] = ucfirst($field) . ' is required';
            }
        }
        return $this;
    }

    public function email(string $field): self
    {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = 'Invalid email format';
        }
        return $this;
    }

    public function min(string $field, int $length): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field][] = ucfirst($field) . " must be at least {$length} characters";
        }
        return $this;
    }

    public function max(string $field, int $length): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field][] = ucfirst($field) . " must not exceed {$length} characters";
        }
        return $this;
    }

    public function maxLength(string $field, int $length): self
    {
        return $this->max($field, $length);
    }

    public function numeric(string $field): self
    {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field][] = ucfirst($field) . ' must be numeric';
        }
        return $this;
    }

    public function in(string $field, array $values): self
    {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $this->errors[$field][] = ucfirst($field) . ' must be one of: ' . implode(', ', $values);
        }
        return $this;
    }

    public function date(string $field, string $format = 'Y-m-d'): self
    {
        if (isset($this->data[$field])) {
            $d = \DateTime::createFromFormat($format, $this->data[$field]);
            if (!$d || $d->format($format) !== $this->data[$field]) {
                $this->errors[$field][] = ucfirst($field) . ' must be a valid date';
            }
        }
        return $this;
    }

    public function passes(): bool
    {
        return empty($this->errors);
    }

    public function fails(): bool
    {
        return !$this->passes();
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function validated(): array
    {
        return $this->data;
    }

    public static function sanitize(string $input): string
    {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
}
