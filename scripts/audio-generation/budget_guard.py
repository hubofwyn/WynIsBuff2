#!/usr/bin/env python3
"""
Budget Guard - Credit tracking and safety margin enforcement for ElevenLabs API.

This module provides budget control functionality to prevent accidental overspending
when generating audio assets with the ElevenLabs API.
"""

import requests
from typing import Dict, Tuple
from observability import LOG


class BudgetGuard:
    """
    Tracks ElevenLabs API credit usage and enforces safety margins.

    Attributes:
        api_key (str): ElevenLabs API key for authentication
        safety_margin (int): Minimum credits to keep as buffer (default 5000)
        user_info_url (str): API endpoint for user credit information
    """

    def __init__(self, api_key: str, safety_margin_credits: int = 5000):
        """
        Initialize BudgetGuard with API credentials and safety parameters.

        Args:
            api_key: ElevenLabs API key
            safety_margin_credits: Minimum credits to maintain as safety buffer
        """
        self.api_key = api_key
        self.safety_margin = safety_margin_credits
        self.user_info_url = "https://api.elevenlabs.io/v1/user"

    def get_remaining_credits(self) -> Tuple[int, Dict]:
        """
        Fetch current credit balance from ElevenLabs API.

        Returns:
            Tuple of (remaining_credits, full_response_dict)

        Raises:
            requests.RequestException: If API call fails
        """
        headers = {
            "xi-api-key": self.api_key
        }

        response = requests.get(self.user_info_url, headers=headers)
        response.raise_for_status()

        user_data = response.json()

        # Extract subscription info
        subscription = user_data.get("subscription", {})
        character_count = subscription.get("character_count", 0)
        character_limit = subscription.get("character_limit", 0)

        # ElevenLabs credits are typically 1:1 with characters
        # Remaining = limit - used
        remaining = character_limit - character_count

        LOG.dev('BUDGET_CREDITS_FETCHED', {
            'subsystem': 'budget_guard',
            'character_count': character_count,
            'character_limit': character_limit,
            'remaining_credits': remaining
        })

        return remaining, user_data

    def estimate_cost(self, duration_seconds: float, asset_type: str = "sfx") -> int:
        """
        Estimate credit cost for generating an audio asset.

        Uses conservative heuristics based on ElevenLabs pricing:
        - SFX: ~200 credits per second
        - Music: ~300 credits per second (more complex processing)

        Args:
            duration_seconds: Length of audio to generate
            asset_type: Type of asset ("sfx" or "music")

        Returns:
            Estimated credit cost (rounded up for safety)
        """
        if asset_type == "music":
            credits_per_second = 300
        else:
            credits_per_second = 200

        estimated_cost = int(duration_seconds * credits_per_second) + 50  # +50 buffer
        return estimated_cost

    def check_budget(
        self,
        duration_seconds: float,
        asset_type: str,
        asset_id: str
    ) -> Tuple[bool, str, int, int]:
        """
        Check if sufficient credits are available for generation.

        Args:
            duration_seconds: Length of audio to generate
            asset_type: Type of asset ("sfx" or "music")
            asset_id: Identifier for the asset (for logging)

        Returns:
            Tuple of (can_proceed, message, remaining_credits, estimated_cost)
        """
        try:
            remaining_credits, _user_data = self.get_remaining_credits()
            estimated_cost = self.estimate_cost(duration_seconds, asset_type)

            # Check if we have enough credits after accounting for safety margin
            available_for_use = remaining_credits - self.safety_margin

            if available_for_use < estimated_cost:
                message = (
                    f"⚠️  BUDGET PROTECTION: Insufficient credits for {asset_id}\n"
                    f"   Remaining: {remaining_credits:,} credits\n"
                    f"   Safety margin: {self.safety_margin:,} credits\n"
                    f"   Available: {available_for_use:,} credits\n"
                    f"   Required: {estimated_cost:,} credits\n"
                    f"   Shortfall: {estimated_cost - available_for_use:,} credits"
                )
                LOG.warn('BUDGET_INSUFFICIENT_CREDITS', {
                    'subsystem': 'budget_guard',
                    'asset_id': asset_id,
                    'remaining_credits': remaining_credits,
                    'safety_margin': self.safety_margin,
                    'available_credits': available_for_use,
                    'estimated_cost': estimated_cost,
                    'shortfall': estimated_cost - available_for_use
                })
                return False, message, remaining_credits, estimated_cost

            message = (
                f"✅ Budget OK for {asset_id}\n"
                f"   Cost: ~{estimated_cost:,} credits\n"
                f"   Remaining after: ~{remaining_credits - estimated_cost:,} credits"
            )
            LOG.dev('BUDGET_CHECK_PASSED', {
                'subsystem': 'budget_guard',
                'asset_id': asset_id,
                'remaining_credits': remaining_credits,
                'estimated_cost': estimated_cost,
                'remaining_after': remaining_credits - estimated_cost
            })
            return True, message, remaining_credits, estimated_cost

        except requests.RequestException as e:
            message = f"❌ Failed to check budget for {asset_id}: {str(e)}"
            LOG.error('BUDGET_CHECK_FAILED', {
                'subsystem': 'budget_guard',
                'asset_id': asset_id,
                'error': str(e),
                'hint': 'Check ElevenLabs API key and network connection'
            })
            return False, message, 0, 0


if __name__ == "__main__":
    # Self-test functionality
    import os
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if not api_key:
        print("❌ ELEVENLABS_API_KEY not found in environment")
        exit(1)

    print("Testing BudgetGuard...")
    guard = BudgetGuard(api_key, safety_margin_credits=5000)

    # Test credit fetch
    try:
        remaining, user_data = guard.get_remaining_credits()
        print(f"✅ Current credits: {remaining:,}")
        print(f"   User tier: {user_data.get('subscription', {}).get('tier', 'unknown')}")
    except Exception as e:
        print(f"❌ Failed to fetch credits: {e}")
        exit(1)

    # Test cost estimation
    print("\n🧮 Cost Estimates:")
    print(f"   0.3s SFX: ~{guard.estimate_cost(0.3, 'sfx'):,} credits")
    print(f"   0.7s SFX: ~{guard.estimate_cost(0.7, 'sfx'):,} credits")
    print(f"   30s Music: ~{guard.estimate_cost(30, 'music'):,} credits")

    # Test budget check
    can_proceed, message, _remaining, _cost = guard.check_budget(0.3, "sfx", "test_asset")
    print(f"\n{message}")

    print("\n✅ BudgetGuard self-test complete")
