#!/bin/zsh

# Script to move Enemy Animations Set files to correct locations - CORRECTED PATHS

# --- Skeleton 1 Animations ---
mv animations/characters/enemies/enemies-skeleton1_attack.png animations/characters/enemies/skeleton1/attack/skeleton1_attack_v1.png
mv animations/characters/enemies/enemies-skeleton1_death.png animations/characters/enemies/skeleton1/death/skeleton1_death_v1.png
mv animations/characters/enemies/enemies-skeleton1_idle.png animations/characters/enemies/skeleton1/idle/skeleton1_idle_v1.png
mv animations/characters/enemies/enemies-skeleton1_movement.png animations/characters/enemies/skeleton1/movement/skeleton1_movement_v1.png
mv animations/characters/enemies/enemies-skeleton1_take_damage.png animations/characters/enemies/skeleton1/take_damage/skeleton1_take_damage_v1.png

# --- Skeleton 2 Animations ---
mv animations/characters/enemies/enemies-skeleton2_attack.png animations/characters/enemies/skeleton2/attack/skeleton2_attack_v1.png
mv animations/characters/enemies/enemies-skeleton2_death.png animations/characters/enemies/skeleton2/death/skeleton2_death_v1.png
mv animations/characters/enemies/enemies-skeleton2_death2.png animations/characters/enemies/skeleton2/death/skeleton2_death_v2.png
mv animations/characters/enemies/enemies-skeleton2_idle.png animations/characters/enemies/skeleton2/idle/skeleton2_idle_v1.png
mv animations/characters/enemies/enemies-skeleton2_movemen.png animations/characters/enemies/skeleton2/movement/skeleton2_movement_v1.png
mv animations/characters/enemies/enemies-skeleton2_take_damage.png animations/characters/enemies/skeleton2/take_damage/skeleton2_take_damage_v1.png

# --- Vampire Animations ---
mv animations/characters/enemies/enemies-vampire_attack.png animations/characters/enemies/vampire/attack/vampire_attack_v1.png
mv animations/characters/enemies/enemies-vampire_death.png animations/characters/enemies/vampire/death/vampire_death_v1.png
mv animations/characters/enemies/enemies-vampire_idle.png animations/characters/enemies/vampire/idle/vampire_idle_v1.png
mv animations/characters/enemies/enemies-vampire_movement.png animations/characters/enemies/vampire/movement/vampire_movement_v1.png
mv animations/characters/enemies/enemies-vampire_take_damage.png animations/characters/enemies/vampire/take_damage/vampire_take_damage_v1.png

echo "Enemy animations moved successfully!"