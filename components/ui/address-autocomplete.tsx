"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

interface Ward {
  Id: string;
  Name: string;
  Level: string;
}

interface District {
  Id: string;
  Name: string;
  Wards: Ward[];
}

interface Province {
  Id: string;
  Name: string;
  Districts: District[];
}

export function AddressAutocomplete({ onChange, required = false }: AddressAutocompleteProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const [streetAddress, setStreetAddress] = useState("");

  // Load provinces from local JSON file
  useEffect(() => {
    const loadAddressData = async () => {
      try {
        const response = await fetch('/vn-address.json');
        const data: Province[] = await response.json();
        setProvinces(data);

        // Auto-select Hà Nội
        const haNoi = data.find(p => p.Name === "Thành phố Hà Nội");
        if (haNoi) {
          setSelectedProvince(haNoi);
        }
      } catch (err) {
        console.error("Failed to load address data:", err);
      }
    };
    loadAddressData();
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      setDistricts(selectedProvince.Districts || []);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedProvince]);

  // Update wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setWards(selectedDistrict.Wards || []);
      setSelectedWard(null);
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // Update full address when any part changes
  useEffect(() => {
    const parts = [
      streetAddress,
      selectedWard?.Name,
      selectedDistrict?.Name,
      selectedProvince?.Name,
    ].filter(Boolean);

    onChange(parts.join(", "));
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="streetAddress" className="text-sm">Số nhà, tên đường *</Label>
        <Input
          id="streetAddress"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required={required}
          placeholder="123 Lê Lợi"
          className="h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="province" className="text-sm">Tỉnh/Thành phố *</Label>
          <select
            id="province"
            value={selectedProvince?.Id || ""}
            onChange={(e) => {
              const province = provinces.find((p) => p.Id === e.target.value);
              setSelectedProvince(province || null);
            }}
            required={required}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn tỉnh/thành</option>
            {provinces.map((province) => (
              <option key={province.Id} value={province.Id}>
                {province.Name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="district" className="text-sm">Quận/Huyện *</Label>
          <select
            id="district"
            value={selectedDistrict?.Id || ""}
            onChange={(e) => {
              const district = districts.find((d) => d.Id === e.target.value);
              setSelectedDistrict(district || null);
            }}
            required={required}
            disabled={!selectedProvince}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.Id} value={district.Id}>
                {district.Name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ward" className="text-sm">Phường/Xã *</Label>
          <select
            id="ward"
            value={selectedWard?.Id || ""}
            onChange={(e) => {
              const ward = wards.find((w) => w.Id === e.target.value);
              setSelectedWard(ward || null);
            }}
            required={required}
            disabled={!selectedDistrict}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.Id} value={ward.Id}>
                {ward.Name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
