"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Optional GPS capture for field survey entries (browser geolocation + manual edit).
 */
export function SurveyLocationFields() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  function capture() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      window.alert("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7));
        setLng(pos.coords.longitude.toFixed(7));
      },
      () => {
        window.alert(
          "Could not read GPS. Allow location access for this site or type coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="survey-latitude">Latitude</Label>
          <Input
            id="survey-latitude"
            name="latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Optional"
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="survey-longitude">Longitude</Label>
          <Input
            id="survey-longitude"
            name="longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="Optional"
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={capture}>
        Use device GPS
      </Button>
    </div>
  );
}
