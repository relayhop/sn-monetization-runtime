#!/usr/bin/env python3
"""
Script para procesar y validar bounties detectados por el radar SN.
"""
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

BOUNTIES_FILE = Path(__file__).parent.parent / "data" / "bounties.json"

REQUIRED_FIELDS = [
    "id",
    "category",
    "winners",
    "current_entries",
    "max_entries",
    "duration_days",
    "reward_per_winner",
    "total_reward",
    "tags",
    "bounty_types",
    "title",
    "status",
    "detected_at",
    "source"
]

def load_bounties() -> Dict[str, Any]:
    """Carga los bounties desde el archivo JSON."""
    if not BOUNTIES_FILE.exists():
        return {"bounties": []}
    with open(BOUNTIES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_bounties(data: Dict[str, Any]) -> None:
    """Guarda los bounties en el archivo JSON."""
    with open(BOUNTIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def validate_bounty(bounty: Dict[str, Any]) -> List[str]:
    """Valida que un bounty tenga todos los campos requeridos."""
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in bounty:
            errors.append(f"Campo requerido faltante: {field}")
    
    # Validaciones adicionales
    if "id" in bounty and not isinstance(bounty["id"], int):
        errors.append("El campo 'id' debe ser un entero")
    
    if "winners" in bounty and bounty["winners"] <= 0:
        errors.append("El número de ganadores debe ser positivo")
    
    if "current_entries" in bounty and "max_entries" in bounty:
        if bounty["current_entries"] > bounty["max_entries"]:
            errors.append("Las entradas actuales no pueden exceder el máximo")
    
    if "status" in bounty and bounty["status"] not in ["open", "closed", "completed"]:
        errors.append("Estado inválido. Debe ser: open, closed, o completed")
    
    return errors

def add_bounty(bounty: Dict[str, Any]) -> bool:
    """Añade un nuevo bounty si no existe y es válido."""
    data = load_bounties()
    
    # Verificar si ya existe
    existing_ids = [b["id"] for b in data["bounties"]]
    if bounty["id"] in existing_ids:
        print(f"Bounty con ID {bounty['id']} ya existe")
        return False
    
    # Validar
    errors = validate_bounty(bounty)
    if errors:
        print("Errores de validación:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    # Añadir timestamp de procesamiento
    bounty["processed_at"] = datetime.utcnow().isoformat() + "Z"
    
    data["bounties"].append(bounty)
    save_bounties(data)
    print(f"Bounty {bounty['id']} añadido correctamente")
    return True

def list_open_bounties() -> List[Dict[str, Any]]:
    """Lista todos los bounties abiertos."""
    data = load_bounties()
    return [b for b in data["bounties"] if b.get("status") == "open"]

def main() -> int:
    """Función principal."""
    if len(sys.argv) < 2:
        print("Uso: python process_bounty.py <comando> [args...]")
        print("Comandos:")
        print("  add <archivo_json>  - Añade un bounty desde archivo JSON")
        print("  list                - Lista bounties abiertos")
        print("  validate <archivo_json> - Valida un bounty sin guardarlo")
        return 1
    
    command = sys.argv[1]
    
    if command == "add":
        if len(sys.argv) < 3:
            print("Se requiere archivo JSON")
            return 1
        with open(sys.argv[2], 'r', encoding='utf-8') as f:
            bounty = json.load(f)
        success = add_bounty(bounty)
        return 0 if success else 1
    
    elif command == "list":
        open_bounties = list_open_bounties()
        for bounty in open_bounties:
            print(f"ID: {bounty['id']} | {bounty['title']} | {bounty['category']} | Entradas: {bounty['current_entries']}/{bounty['max_entries']}")
        return 0
    
    elif command == "validate":
        if len(sys.argv) < 3:
            print("Se requiere archivo JSON")
            return 1
        with open(sys.argv[2], 'r', encoding='utf-8') as f:
            bounty = json.load(f)
        errors = validate_bounty(bounty)
        if errors:
            print("Errores de validación:")
            for error in errors:
                print(f"  - {error}")
            return 1
        else:
            print("Bounty válido")
            return 0
    
    else:
        print(f"Comando desconocido: {command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
