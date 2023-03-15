using EasyHook;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace DataGetter
{
    public class InjectionEntryPoint : IEntryPoint
    {
        private readonly ServerInterface pipeServer;
        private readonly Queue<string> dataExtracted = new Queue<string>();
        public int DataCursor;
        //public int packetNumber = 0;

        public IntPtr TargetAddress { get; set; }

        public string DataRead { get; set; }

        public Process TargetProcess { get; set; }

        public InjectionEntryPoint(RemoteHooking.IContext context, string channelName)
        {
            pipeServer = RemoteHooking.IpcConnectClient<ServerInterface>(channelName);
            TargetProcess = Process.GetProcessesByName("SNAP")[0];
            pipeServer.Ping();
        }

        public void WebsocketDataRecievedHook(IntPtr socket, IntPtr data, int offset, int length)
        {
            byte[] numArray = new byte[length];
            SigScanSharp.Win32.ReadProcessMemory(TargetProcess.Handle, (ulong)data.ToInt64() + 32UL, numArray, length);
            //File.WriteAllBytes("binDebug/debugFile" + packetNumber.ToString() + ".bin", numArray);
            //packetNumber++;
            if ((numArray[0] != 72 || numArray[1] != 84) && length > 0)
            {
                using (MemoryStream input = new MemoryStream(numArray))
                {
                    using (BinaryReader reader = new BinaryReader(input))
                    {
                        try
                        {
                            byte[] bytes;
                            if (length == 4096 || DataCursor > 0)
                            {
                                int count = 4 * DataCursor++;
                                List<byte> byteList = new List<byte>();
                                if (count > 0)
                                    byteList.AddRange(reader.ReadBytes(count));
                                DecodeInt32(reader);
                                if (input.Position < input.Length)
                                    byteList.AddRange(reader.ReadBytes((int)(input.Length - input.Position)));
                                bytes = byteList.ToArray();
                            }
                            else
                            {
                                int count = DecodeInt32(reader);
                                bytes = reader.ReadBytes(count);
                            }
                            if (DataRead == null)
                                DataRead = "";
                            DataRead += Encoding.UTF8.GetString(bytes);
                            if (length != 4096)
                            {
                                pipeServer.ReportPacket(DataRead);
                                DataRead = null;
                                DataCursor = 0;
                            }
                        }
                        catch (Exception ex)
                        {
                            pipeServer.ReportMessage(string.Format("Error: {0}", ex));
                        }
                    }
                }
            }
            (Marshal.GetDelegateForFunctionPointer(TargetAddress, typeof(WebsocketDataRecieved_Delegate)) as WebsocketDataRecieved_Delegate)(socket, data, offset, length);
        }

        public static int DecodeInt32(BinaryReader reader)
        {
            int num1 = reader.ReadByte();
            int num2 = reader.ReadByte();
            return num1 == 129 && num2 != 126 ? num2 : 128 * (2 * reader.ReadByte()) + reader.ReadByte();
        }

        public IntPtr GetHookTarget()
        {
            Process process = Process.GetProcessesByName("SNAP")[0];
            SigScanSharp sigScanSharp = new SigScanSharp(process.Handle);
            ProcessModule targetModule = null;

            foreach (ProcessModule module in (ReadOnlyCollectionBase)process.Modules)
            {
                if (module.FileName.Contains("GameAssembly"))
                {
                    targetModule = module;
                    break;
                }
            }
            sigScanSharp.SelectModule(targetModule);
            sigScanSharp.AddPattern("DataReceived", "40 53 55 56 41 54 41 55 41 56 41 57 48 83 EC 30 80 3D ? ? ? ? 00 41 8B F1 41 8B E8 4C 8B E2");
            return new IntPtr((long)sigScanSharp.FindPatterns(out long _)["DataReceived"]);
        }

        public void Run(RemoteHooking.IContext context, string channelName)
        {
            TargetAddress = GetHookTarget();
            //pipeServer.ReportMessage(((ulong)TargetAddress).ToString());
            LocalHook localHook = null;
            try
            {
                localHook = LocalHook.Create(TargetAddress, new WebsocketDataRecieved_Delegate(WebsocketDataRecievedHook), this);
                localHook.ThreadACL.SetExclusiveACL(new int[1]);
                //pipeServer.ReportMessage("DataReceived Hook Installed");
            }
            catch (Exception ex)
            {
                pipeServer.ReportMessage("Error: " + ex.ToString());
            }
            //RemoteHooking.WakeUpProcess();
            try
            {
                while (true)
                {
                    Thread.Sleep(500);
                    string[] messages = null;
                    lock (dataExtracted)
                    {
                        messages = dataExtracted.ToArray();
                        dataExtracted.Clear();
                    }
                    if (messages != null && messages.Length != 0)
                        pipeServer.ReportMessages(messages);
                    else
                        pipeServer.Ping();
                }
            }
            catch
            {
            }
            localHook.Dispose();
            LocalHook.Release();
        }

        [UnmanagedFunctionPointer(CallingConvention.Cdecl, CharSet = CharSet.Unicode)]
        private delegate void WebsocketDataRecieved_Delegate(
          IntPtr socket,
          IntPtr data,
          int offset,
          int length);
    }
}
