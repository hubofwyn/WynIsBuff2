#!/usr/bin/env python3
"""
WynIsBuff2 Audio Generation Observability Module

Python equivalent of the JavaScript LogSystem for audio generation scripts.
Provides structured logging with event codes, subsystems, and contextual data.

Matches WynIsBuff2 observability patterns:
- Structured JSON logging with event codes
- Log levels: DEV, INFO, WARN, ERROR, FATAL
- Subsystem categorization
- Contextual data injection
- Statistics tracking

Usage:
    from observability import LOG

    LOG.info('AUDIO_GENERATION_START', {
        'subsystem': 'audio_generation',
        'phase': 1,
        'asset_count': 12
    })

    LOG.error('AUDIO_GENERATION_FAILED', {
        'subsystem': 'audio_generation',
        'asset_id': 'sfx_jump1_01',
        'error': str(error)
    })
"""

import json
import logging
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum


class LogLevel(str, Enum):
    """Log levels matching WynIsBuff2 LogLevel.js"""
    DEV = 'DEV'
    INFO = 'INFO'
    WARN = 'WARN'
    ERROR = 'ERROR'
    FATAL = 'FATAL'


class ObservabilityLogger:
    """
    Python equivalent of LogSystem.js for audio generation.

    Provides structured logging with event codes, subsystems, and
    contextual data matching the WynIsBuff2 observability pattern.
    """

    def __init__(self, min_level: LogLevel = LogLevel.DEV):
        """
        Initialize the observability logger.

        Args:
            min_level: Minimum log level to output
        """
        self.min_level = min_level
        self.stats = {
            'total_logs': 0,
            'logs_by_level': {
                LogLevel.DEV: 0,
                LogLevel.INFO: 0,
                LogLevel.WARN: 0,
                LogLevel.ERROR: 0,
                LogLevel.FATAL: 0,
            },
            'logs_by_subsystem': {},
        }

        # Configure Python logging for console output
        self._setup_console_logging()

    def _setup_console_logging(self):
        """Setup Python logging for console output with colors."""
        # Create custom formatter
        class ColoredFormatter(logging.Formatter):
            """Custom formatter with colors and emojis matching WynIsBuff2 style."""

            # ANSI color codes
            COLORS = {
                'DEV': '\033[36m',      # Cyan
                'INFO': '\033[32m',     # Green
                'WARN': '\033[33m',     # Yellow
                'ERROR': '\033[31m',    # Red
                'FATAL': '\033[35m',    # Magenta
                'RESET': '\033[0m',     # Reset
            }

            # Emoji prefixes
            EMOJIS = {
                'DEV': '🔍',
                'INFO': 'ℹ️',
                'WARN': '⚠️',
                'ERROR': '❌',
                'FATAL': '💀',
            }

            def format(self, record):
                level = record.levelname
                color = self.COLORS.get(level, self.COLORS['RESET'])
                emoji = self.EMOJIS.get(level, '')
                reset = self.COLORS['RESET']

                # Format: [EMOJI] [LEVEL] EVENT_CODE: message
                return f"{emoji}  [{color}{level}{reset}] {record.getMessage()}"

        # Configure root logger
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(ColoredFormatter())

        logger = logging.getLogger('audio_generation')
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

        self.console_logger = logger

    def _should_log(self, level: LogLevel) -> bool:
        """
        Check if a log should be output based on minimum level.

        Args:
            level: Log level to check

        Returns:
            True if log should be output
        """
        level_priority = {
            LogLevel.DEV: 0,
            LogLevel.INFO: 1,
            LogLevel.WARN: 2,
            LogLevel.ERROR: 3,
            LogLevel.FATAL: 4,
        }

        return level_priority[level] >= level_priority[self.min_level]

    def _format_log_entry(
        self,
        level: LogLevel,
        code: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Format a log entry matching WynIsBuff2 LogSystem format.

        Args:
            level: Log level
            code: Event code (e.g., 'AUDIO_GENERATION_START')
            data: Contextual data

        Returns:
            Formatted log entry
        """
        return {
            'timestamp': datetime.now().isoformat(),
            'level': level.value,
            'code': code,
            'subsystem': data.get('subsystem', 'audio_generation'),
            'message': data.get('message', ''),
            'data': {k: v for k, v in data.items() if k not in ['subsystem', 'message']},
        }

    def _log(self, level: LogLevel, code: str, data: Dict[str, Any] = None):
        """
        Core logging method.

        Args:
            level: Log level
            code: Event code
            data: Contextual data dictionary
        """
        if data is None:
            data = {}

        # Check if should log
        if not self._should_log(level):
            return

        # Update statistics
        self.stats['total_logs'] += 1
        self.stats['logs_by_level'][level] += 1

        subsystem = data.get('subsystem', 'audio_generation')
        if subsystem not in self.stats['logs_by_subsystem']:
            self.stats['logs_by_subsystem'][subsystem] = 0
        self.stats['logs_by_subsystem'][subsystem] += 1

        # Format log entry
        entry = self._format_log_entry(level, code, data)

        # Console output
        message = data.get('message', '')
        if message:
            log_msg = f"{code}: {message}"
        else:
            log_msg = code

        # Add structured data if present
        extra_data = entry['data']
        if extra_data:
            # Filter out None values and format compactly
            compact_data = {k: v for k, v in extra_data.items() if v is not None}
            if compact_data:
                log_msg += f" | {json.dumps(compact_data, separators=(',', ':'))}"

        # Map to Python logging levels
        level_map = {
            LogLevel.DEV: logging.DEBUG,
            LogLevel.INFO: logging.INFO,
            LogLevel.WARN: logging.WARNING,
            LogLevel.ERROR: logging.ERROR,
            LogLevel.FATAL: logging.CRITICAL,
        }

        self.console_logger.log(level_map[level], log_msg)

    def dev(self, code: str, data: Dict[str, Any] = None):
        """
        Log development/debug information.

        Args:
            code: Event code (e.g., 'AUDIO_ASSET_CACHED')
            data: Contextual data
        """
        self._log(LogLevel.DEV, code, data or {})

    def info(self, code: str, data: Dict[str, Any] = None):
        """
        Log informational messages.

        Args:
            code: Event code (e.g., 'AUDIO_GENERATION_START')
            data: Contextual data
        """
        self._log(LogLevel.INFO, code, data or {})

    def warn(self, code: str, data: Dict[str, Any] = None):
        """
        Log warnings.

        Args:
            code: Event code (e.g., 'AUDIO_BUDGET_WARNING')
            data: Contextual data
        """
        self._log(LogLevel.WARN, code, data or {})

    def error(self, code: str, data: Dict[str, Any] = None):
        """
        Log errors.

        Args:
            code: Event code (e.g., 'AUDIO_GENERATION_FAILED')
            data: Contextual data
        """
        self._log(LogLevel.ERROR, code, data or {})

    def fatal(self, code: str, data: Dict[str, Any] = None):
        """
        Log fatal errors.

        Args:
            code: Event code (e.g., 'AUDIO_SYSTEM_CRASH')
            data: Contextual data
        """
        self._log(LogLevel.FATAL, code, data or {})

    def get_stats(self) -> Dict[str, Any]:
        """
        Get logging statistics.

        Returns:
            Statistics dictionary
        """
        return {
            'total_logs': self.stats['total_logs'],
            'logs_by_level': {k.value: v for k, v in self.stats['logs_by_level'].items()},
            'logs_by_subsystem': dict(self.stats['logs_by_subsystem']),
        }

    def summary(self):
        """Print logging statistics summary."""
        stats = self.get_stats()
        print("\n" + "=" * 70)
        print("📊 Logging Statistics")
        print(f"   Total logs: {stats['total_logs']}")
        print(f"   By level: {json.dumps(stats['logs_by_level'], indent=6)}")
        print(f"   By subsystem: {json.dumps(stats['logs_by_subsystem'], indent=6)}")
        print("=" * 70 + "\n")


# Singleton instance matching JavaScript pattern
LOG = ObservabilityLogger(min_level=LogLevel.DEV)


# Example usage and self-test
if __name__ == "__main__":
    print("Testing WynIsBuff2 Audio Generation Observability Module\n")

    # Test all log levels
    LOG.dev('TEST_DEV', {
        'subsystem': 'test',
        'message': 'This is a development log'
    })

    LOG.info('TEST_INFO', {
        'subsystem': 'test',
        'message': 'Audio generation started',
        'phase': 1,
        'asset_count': 12
    })

    LOG.warn('TEST_WARN', {
        'subsystem': 'test',
        'message': 'Budget approaching limit',
        'credits_remaining': 5000
    })

    LOG.error('TEST_ERROR', {
        'subsystem': 'test',
        'message': 'Failed to generate asset',
        'asset_id': 'test_asset',
        'error': 'Network timeout'
    })

    LOG.fatal('TEST_FATAL', {
        'subsystem': 'test',
        'message': 'Critical system failure',
        'details': 'API key invalid'
    })

    # Print statistics
    LOG.summary()
